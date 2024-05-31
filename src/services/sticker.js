
const ffmpeg = require('fluent-ffmpeg') // ^2.1.2
const { TEMP_DIR } = require('../config')
const fs = require('fs')

function getDataBlocksLength(buffer, offset) {
	var length = 0
	while (buffer[offset + length]) {
		length += buffer[offset + length] + 1
	}
	return length + 1
}

exports.sticker = function (Path) {
	const deleteFile = (file) => fs.existsSync(file) && fs.unlinkSync(file)
	const mkDir = (dir) => fs.existsSync(dir) || fd.mkdirSync(dir)
	function isGIF(buffer) {
		var header = buffer.slice(0, 3).toString('ascii')
		return (header === 'GIF')
	}
	const isAnimated = async (filePath) => {
		const buffer = this.readFileSync(filePath)
		const type = (await Buffer.fromBuffer(buffer)).ext
		switch (type) {
			case 'webp':
				var ANIM = [0x41, 0x4E, 0x49, 0x4D]
				for (var i = 0; i < buffer.length; i++) {
					for (var j = 0; j < ANIM.length; j++) {
						if (buffer[i + j] !== ANIM[j]) {
							break
						}
					}
					if (j === ANIM.length) return true
				}
				return false
			case 'gif': case 'mp4':
				return true
			case 'png':
				const Jimp = require('jimp');
				const image = await Jimp.read(filePath);
				return image.hasAlpha()
				break
		}
	}
	const checkfile = ({ file, ext }) => new Promise((resolve, reject) => {
		this.exec(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration -of csv=p=0:s=x ${file}`, (err, stdout) => {
			if (err) return reject(err);

			const [arg0, arg1, arg2] = stdout.split("x")
			resolve({
				file,
				ext,
				time: `${arg2.trim().includes('.') ? arg2.trim().split('.')[0] : arg2.trim()}`,
				width: arg0.trim(),
				height: arg1.trim()
			})
		})
	})
	const diretory = mkDir(TEMP_DIR)
	return this.download(Path, diretory + 'st-' + Date.now()).then(async (v) => {
		const edit = await checkfile(v)
		edit.edit = (fileEdit) => this.download(fileEdit, diretory + 'edit-' + Date.now()).then((res) => {
			return new Promise(async (resolve, reject) => {
				const cropImg = diretory + `${Date.now()}_crop.png`
				const dateImg = diretory + `${Date.now()}_save.png`
				const dateWebp = diretory + `${Date.now()}_result.webp`
				ffmpeg(edit.file).on('error', (err) => {
					this.unlinkSync(edit.file)
					reject(err)
				}).on('end', () => {
					deleteFile(edit.file)
					this.exec(`ffmpeg -hide_banner -i ${cropImg} -i ${res.file} -filter_complex "[0]scale=400:400[ava];[1]alphaextract[alfa];[ava][alfa]alphamerge" ${dateImg}`, (err) => {
						this.unlinkSync(res.file)
						this.unlinkSync(cropImg)
						if (err) return reject(err)
						this.exec(`ffmpeg -i ${dateImg} -vcodec libwebp -filter:v fps=fps=20 -lossless 1 -loop 0 -preset default -an -vsync 0 -s 320:320 ${dateWebp}`, (err) => {
							this.unlinkSync(dateImg)
							if (err) return reject(err)
							edit.ext = 'webp'
							edit.file = dateWebp
							resolve(edit.file)
						})
					})
				}).addOutputOptions([
					`-vf`, `crop=w='min(min(iw\,ih)\,${edit.width})':h='min(min(iw\,ih)\,${edit.height})',scale=640:640,setsar=1,fps=15`, `-loop`, `0`, `-preset`, `default`, `-an`, `-vsync`, `0`, `-s`, `640:640`
				]).save(cropImg)
			});
		})
		edit.convertImageTransparent = async (keybg = []) => {
			const keyRandom = keybg && Array.isArray(keybg) ? keybg[Math.floor(Math.random() * keybg.length)] : []
			const { removeBackgroundFromImageFile } = require('remove.bg')
			if (keybg.length) {
				const { base64img } = await removeBackgroundFromImageFile({
					path: edit.file,
					apiKey: keyRandom,
					size: 'auto',
					type: 'auto'
				})
				this.unlinkSync(edit.file)
				edit.ext = 'png'
				edit.file = diretory + 'edit-' + Date.now() + '.png'
				const buffer = new Buffer.from(base64img, 'base64')
				this.writeFileSync(edit.file, buffer)
			}
			return Promise.resolve(edit.file)
		}
		edit.convertWebpToMedia = () => new Promise(async (resolve, reject) => {
			const img = diretory + Date.now() + '.png'
			this.exec(`convert ${edit.file} -trim +repage -background transparent -flatten ${img}`, (err) => {
				if (err) return reject(err)
				this.unlinkSync(edit.file)
				edit.file = img
				resolve(edit.file)
			})
		})
		edit.create = (ops) => new Promise(async (resolve, reject) => {
			if (/png|jpeg|jpg|gif|mp4|webm/.test(edit.ext)) {
				const { fps, type } = Object.assign({ fps: 15, type: null }, ops || {})
				const { width, height } = await checkfile(edit)
				const dateWebp = diretory + `${Date.now()}_result.webp`
				let typeConfig = /crop|cortar/.test(type) ? [
					`-vcodec`, `libwebp`, `-vf`, `crop=w='min(min(iw\,ih)\,${width})':h='min(min(iw\,ih)\,${height})',scale=640:640,setsar=1,fps=${fps}`, `-loop`, `0`, `-ss`, `00:00:00.0`, `-t`, `00:00:11.0`, `-preset`, `default`, `-an`, `-vsync`, `0`, `-s`, `512:512`
				] : /esticar|stretch/.test(type) ? [
					`-vcodec`, `libwebp`, `-filter:v`, `fps=fps=${fps}`, `-lossless`, `1`, `-loop`, `0`, `-preset`, `default`, `-an`, `-vsync`, `0`, `-s`, `512:512`, `-ss`, `00:00:00`, `-t`, `00:00:11.0`
				] : [
					`-vcodec`, `libwebp`, `-vf`, `scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=${fps}, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse`, `-loop`, `0`, `-ss`, `00:00:00`, `-t`, `00:00:11.0`
				]
				ffmpeg(edit.file).on('start', () => {
					this.log("Preparing file:", edit.file, "| fps:", fps)
				}).on('error', () => {
					this.unlinkSync(edit.file)
					reject(`Export error: ${edit.ext}`)
				}).on('end', () => {
					this.unlinkSync(edit.file)
					edit.ext = 'webp'
					edit.file = dateWebp
					resolve(edit.file)
				}).addOutputOptions(typeConfig)
					.toFormat('webp')
					.save(dateWebp)
			} else {
				resolve(edit.file)
			}
		})
		edit.exifAdd = ({ exif, pack, author, emojis = ["Drip fldp 🥶"], options = {} }) => new Promise(async (resolve, reject) => {
			if (exif && exif.endsWith('.exif') && this.existsSync(exif)) return this.exec(`webpmux -set exif ${exif} ${edit.file} -o ${edit.file}`, () => resolve(edit.file))

			const json = {
				'sticker-pack-id': "https://github.com/CrapNause",
				...(pack ? { 'sticker-pack-name': pack } : {}),
				...(author ? { 'sticker-pack-publisher': author } : {}),
				'emojis': emojis,
				...options
			};
			const webpMux = require("node-webpmux")
			const img = new webpMux.Image()
			const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00])
			const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8")
			const exifBuffer = Buffer.concat([exifAttr, jsonBuff])
			exifBuffer.writeUIntLE(jsonBuff.length, 14, 4)
			await img.load(edit.file)
			this.unlinkSync(edit.file)
			img.exif = exifBuffer
			await img.save(edit.file)
			resolve(edit.file)
		})
		edit.size = () => this.statSync(edit.file)?.size || 0
		return Promise.resolve(edit)
	})
}