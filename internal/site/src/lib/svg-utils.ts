/**
 * Validates and sanitizes raw SVG markup on the client side.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateSvg(svgString: string): { valid: boolean; error?: string } {
	const trimmed = svgString.trim()
	if (!trimmed) {
		return { valid: true }
	}

	if (trimmed.length > 500000) {
		return { valid: false, error: "SVG size exceeds 500KB limit." }
	}

	const parser = new DOMParser()
	const doc = parser.parseFromString(trimmed, "image/svg+xml")

	const parserError = doc.querySelector("parsererror")
	if (parserError) {
		return { valid: false, error: parserError.textContent || "Invalid XML / SVG syntax." }
	}

	const root = doc.documentElement
	if (!root || root.tagName.toLowerCase() !== "svg") {
		return { valid: false, error: "Root element must be an <svg> tag." }
	}

	const disallowedTags = ["script", "iframe", "object", "embed", "applet", "foreignobject"]
	for (const tag of disallowedTags) {
		if (doc.getElementsByTagName(tag).length > 0) {
			return { valid: false, error: `Disallowed element <${tag}> found in SVG.` }
		}
	}

	const allElements = doc.querySelectorAll("*")
	for (let i = 0; i < allElements.length; i++) {
		const el = allElements[i]
		const attrs = el.attributes
		for (let j = 0; j < attrs.length; j++) {
			const attr = attrs[j]
			const name = attr.name.toLowerCase()
			const val = attr.value.trim().toLowerCase()

			if (name.startsWith("on")) {
				return { valid: false, error: `Disallowed event attribute "${attr.name}" found in SVG.` }
			}

			if (val.startsWith("javascript:") || val.startsWith("vbscript:") || val.startsWith("data:text/html")) {
				return { valid: false, error: `Disallowed URI "${attr.value}" found in attribute "${attr.name}".` }
			}
		}
	}

	return { valid: true }
}
