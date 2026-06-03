const fs = require("fs/promises")
const path = require("path")
const sharp = require("sharp")

const projectRoot = path.resolve(__dirname, "..")
const imageDir = path.join(projectRoot, "public", "IMG")
const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"])
const temporaryImagePattern = /\.optimized-tmp\.(?:jpe?g|png|webp)$/i
const dryRun = process.argv.includes("--dry-run")
const formatter = new Intl.NumberFormat("en", { maximumFractionDigits: 1 })

const IMAGE_RULES = {
	logoMaxDimension: 512,
	contentMaxDimension: 1200,
	jpegQuality: 78,
	webpQuality: 76,
	pngQuality: 82,
	minSavingsBytes: 24 * 1024,
	minSavingsRatio: 0.25,
	significantSavingsBytes: 48 * 1024,
}

function toKb(bytes) {
	return `${formatter.format(bytes / 1024)} KB`
}

function getMaxDimension(filename) {
	const normalizedName = filename.toLowerCase()
	if (normalizedName.includes("logo")) {
		return IMAGE_RULES.logoMaxDimension
	}
	return IMAGE_RULES.contentMaxDimension
}

function buildPipeline(input, ext, maxDimension) {
	const pipeline = sharp(input, { failOn: "none" }).rotate().resize({
		width: maxDimension,
		height: maxDimension,
		fit: "inside",
		withoutEnlargement: true,
	})

	if (ext === ".jpg" || ext === ".jpeg") {
		return pipeline.jpeg({
			quality: IMAGE_RULES.jpegQuality,
			mozjpeg: true,
			progressive: true,
		})
	}

	if (ext === ".png") {
		return pipeline.png({
			compressionLevel: 9,
			effort: 10,
			palette: true,
			quality: IMAGE_RULES.pngQuality,
		})
	}

	return pipeline.webp({
		quality: IMAGE_RULES.webpQuality,
		effort: 6,
	})
}

function shouldWriteOptimizedImage(
	stat,
	metadata,
	optimizedSize,
	maxDimension,
) {
	const savedBytes = stat.size - optimizedSize
	const width = metadata.width || 0
	const height = metadata.height || 0
	const resized = width > maxDimension || height > maxDimension
	const significantSavings = savedBytes >= IMAGE_RULES.significantSavingsBytes
	const meaningfulSavings =
		savedBytes >= IMAGE_RULES.minSavingsBytes &&
		savedBytes / stat.size >= IMAGE_RULES.minSavingsRatio

	return savedBytes > 0 && (resized || significantSavings || meaningfulSavings)
}

async function optimizeImage(filename) {
	if (temporaryImagePattern.test(filename)) return null

	const ext = path.extname(filename).toLowerCase()
	if (!supportedExtensions.has(ext)) return null

	const inputPath = path.join(imageDir, filename)
	const stat = await fs.stat(inputPath)
	const maxDimension = getMaxDimension(filename)
	const inputBuffer = await fs.readFile(inputPath)
	const metadata = await sharp(inputBuffer, { failOn: "none" }).metadata()
	const pipeline = buildPipeline(inputBuffer, ext, maxDimension)
	const optimizedBuffer = await pipeline.toBuffer()
	const shouldWrite = shouldWriteOptimizedImage(
		stat,
		metadata,
		optimizedBuffer.length,
		maxDimension,
	)

	if (shouldWrite && !dryRun) {
		await fs.writeFile(inputPath, optimizedBuffer)
	}

	return {
		filename,
		width: metadata.width || 0,
		height: metadata.height || 0,
		before: stat.size,
		after: shouldWrite ? optimizedBuffer.length : stat.size,
		saved: shouldWrite ? stat.size - optimizedBuffer.length : 0,
		optimized: shouldWrite,
	}
}

async function main() {
	const entries = await fs.readdir(imageDir)
	const results = []

	for (const filename of entries) {
		try {
			const result = await optimizeImage(filename)
			if (result) results.push(result)
		} catch (error) {
			console.warn(`Skipped ${filename}: ${error.message}`)
		}
	}

	const beforeTotal = results.reduce((sum, item) => sum + item.before, 0)
	const afterTotal = results.reduce((sum, item) => sum + item.after, 0)
	const optimizedCount = results.filter((item) => item.optimized).length

	console.log(
		`${dryRun ? "Dry run" : "Optimized"} ${optimizedCount}/${results.length} images in public/IMG`,
	)
	for (const item of results) {
		const status = item.optimized ? "optimized" : "kept"
		const dimensions =
			item.width && item.height ? `${item.width}x${item.height}` : "unknown"
		console.log(
			`${status.padEnd(9)} ${toKb(item.before).padStart(10)} -> ${toKb(item.after).padStart(10)} ` +
				`(${toKb(item.saved)} saved) ${dimensions.padEnd(11)} ${item.filename}`,
		)
	}

	console.log(
		`Total: ${toKb(beforeTotal)} -> ${toKb(afterTotal)} (${toKb(beforeTotal - afterTotal)} saved)`,
	)
}

main().catch((error) => {
	console.error(error)
	process.exit(1)
})
