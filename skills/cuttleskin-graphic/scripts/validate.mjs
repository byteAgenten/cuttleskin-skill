import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
// ../../packages/config/src/settings.ts
const MODES = ["embedded", "editor"];
const IMAGE_RENDERINGS = ["quality", "speed"];
Object.freeze({
	mode: "embedded",
	imageRendering: "quality"
});
// ../../packages/config/src/graphic-config.ts
const EASING_NAMES = [
	"step",
	"linear",
	"easein",
	"easeout",
	"easeinout",
	"backin",
	"backout",
	"elastic",
	"bounce",
	"easeoutqart"
];
const VARIABLE_TYPES = [
	"number",
	"boolean",
	"text"
];
/** Reserved frame names generated from the variable domain. */
/** Positions at the ends of a number variable's range; frames there follow range changes. */
const RANGE_ENDS = {
	min: "$min",
	max: "$max"
};
const TRANSFORMATION_TYPES = [
	"translate",
	"rotate",
	"scale",
	"text",
	"image-url",
	"opacity",
	"fill-color",
	"stroke-color",
	"stroke-width",
	"motion-path"
];
const ANCHOR_NAMES = [
	"center",
	"top-left",
	"top",
	"top-right",
	"left",
	"right",
	"bottom-left",
	"bottom",
	"bottom-right"
];
// ../../packages/config/src/frame-position.ts
/**
* Variable value at which a frame is located: `$min`/`$max` resolve to the range of a number
* variable, all other positions are values of the variable already.
*/
function resolveFramePosition(variable, at) {
	if (variable.type === "number") {
		if (at === RANGE_ENDS.min) return variable.minimum;
		if (at === RANGE_ENDS.max) return variable.maximum;
	}
	return at;
}
// ../../packages/config/src/parse/issues.ts
/** Marker for a value that failed validation; the issue has already been recorded. */
const INVALID = Symbol("invalid");
/** Collects issues and builds paths while walking the input. */
var IssueCollector = class {
	issues = [];
	add(path, message, code, params) {
		this.issues.push({
			path,
			message,
			code,
			...params ? { params } : {}
		});
		return INVALID;
	}
};
function joinPath(base, key) {
	if (typeof key === "number") return `${base}[${String(key)}]`;
	return base ? `${base}.${key}` : key;
}
// ../../packages/config/src/parse/primitives.ts
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function describe(value) {
	if (value === null) return "null";
	if (Array.isArray(value)) return "array";
	return typeof value;
}
function record(value, path, issues) {
	return isRecord(value) ? value : expectedType(issues, path, "object", value);
}
/** Records a value of the wrong type; `expected` is a type name like `object` or `number`. */
function expectedType(issues, path, expected, value) {
	const actual = describe(value);
	return issues.add(path, `Expected ${expected}, got ${actual}`, "config.expectedType", {
		expected,
		actual
	});
}
function string(value, path, issues) {
	return typeof value === "string" ? value : expectedType(issues, path, "string", value);
}
function nonEmptyString(value, path, issues) {
	const result = string(value, path, issues);
	if (result === INVALID) return INVALID;
	return result.trim() ? result : issues.add(path, "Must not be empty", "config.empty");
}
function finiteNumber(value, path, issues) {
	return typeof value === "number" && Number.isFinite(value) ? value : expectedType(issues, path, "finite number", value);
}
function boolean(value, path, issues) {
	return typeof value === "boolean" ? value : expectedType(issues, path, "boolean", value);
}
function oneOf(allowed, value, path, issues) {
	if (allowed.includes(value)) return value;
	const actual = typeof value === "string" ? JSON.stringify(value) : describe(value);
	const options = allowed.join(", ");
	return issues.add(path, `Expected one of ${options}, got ${actual}`, "config.expectedOneOf", {
		options,
		actual
	});
}
function point(value, path, issues) {
	const input = record(value, path, issues);
	if (input === INVALID) return INVALID;
	const x = finiteNumber(input.x, joinPath(path, "x"), issues);
	const y = finiteNumber(input.y, joinPath(path, "y"), issues);
	return x === INVALID || y === INVALID ? INVALID : {
		x,
		y
	};
}
/** Validates each item; invalid items are dropped (their issues are recorded). */
function list(value, path, issues, item) {
	if (value === void 0 || value === null) return [];
	if (!Array.isArray(value)) {
		expectedType(issues, path, "array", value);
		return [];
	}
	const result = [];
	value.forEach((entry, index) => {
		const parsed = item(entry, joinPath(path, index));
		if (parsed !== INVALID) result.push(parsed);
	});
	return result;
}
/** Runs `parse` for a present value; `undefined` and `null` count as absent. */
function optional(value, parse) {
	return value === void 0 || value === null ? void 0 : parse(value);
}
// ../../packages/config/src/parse/upgrade-graphic-config.ts
/** Positions of the former reserved frame names. */
const RESERVED_POSITIONS = {
	$min: "$min",
	$max: "$max",
	$false: false,
	$true: true
};
/** Copy of `record` without the property `key`. */
function withoutKey(record, key) {
	return Object.fromEntries(Object.entries(record).filter(([name]) => name !== key));
}
/**
* Converts one frame of the former object format (`name -> { at?, value, transition? }`) into
* an entry of the frame list. `keyFrames` are the named positions of the variable in the oldest
* format. Names that only repeat the position are dropped, other names are kept as `label`.
*/
function upgradeFrame(name, frame, keyFrames) {
	const at = Object.hasOwn(RESERVED_POSITIONS, name) ? RESERVED_POSITIONS[name] : "at" in frame ? frame.at : Object.hasOwn(keyFrames, name) ? keyFrames[name] : name.startsWith("$") ? name : void 0;
	const label = name.startsWith("$") || name === String(at) ? void 0 : name;
	const easing = frame.easing ?? frame.transition;
	return {
		...at === void 0 ? {} : { at },
		value: frame.value,
		...easing === void 0 || easing === null ? {} : { easing },
		...label === void 0 ? {} : { label }
	};
}
function upgradeTransformation(transformation, keyFramesByVariable) {
	if (!isRecord(transformation) || !isRecord(transformation.frames)) return transformation;
	const keyFrames = (typeof transformation.variable === "string" ? keyFramesByVariable.get(transformation.variable) : void 0) ?? {};
	let fallback;
	const frames = [];
	for (const [name, frame] of Object.entries(transformation.frames)) if (!isRecord(frame)) frames.push({
		at: name,
		value: frame
	});
	else if (name === "$default") fallback = frame.value;
	else frames.push(upgradeFrame(name, frame, keyFrames));
	const rest = withoutKey(transformation, "frames");
	const keepDefault = "default" in rest || fallback === void 0 || fallback === null;
	return {
		...rest,
		frames,
		...keepDefault ? {} : { default: fallback }
	};
}
/**
* Converts configurations of former formats into the current one, in which every transformation
* lists its frames with their position (`frames: [{ at, value }]`):
*
* - Frames as object keyed by name: `$min`/`$max` and `$false`/`$true` become positions, other
*   frames keep their `at`, `$default` becomes the transformation's `default`, the frame option
*   `transition` becomes `easing`.
* - Named key frames of variables (`variables[].keyFrames`): referenced frames get the position
*   of their key frame; the `keyFrames` are removed.
*
* Returns the input unchanged if there is nothing to convert, otherwise a converted copy; the
* input is never modified.
*/
function upgradeGraphicConfig(input) {
	if (!isRecord(input)) return input;
	const variables = Array.isArray(input.variables) ? input.variables : [];
	const transformations = Array.isArray(input.transformations) ? input.transformations : [];
	const keyFramesByVariable = /* @__PURE__ */ new Map();
	for (const variable of variables) if (isRecord(variable) && "keyFrames" in variable && typeof variable.name === "string") keyFramesByVariable.set(variable.name, isRecord(variable.keyFrames) ? variable.keyFrames : {});
	const formerFrames = transformations.some((transformation) => isRecord(transformation) && isRecord(transformation.frames));
	if (keyFramesByVariable.size === 0 && !formerFrames) return input;
	return {
		...input,
		...Array.isArray(input.variables) ? { variables: variables.map((variable) => {
			if (!isRecord(variable) || !("keyFrames" in variable)) return variable;
			return withoutKey(variable, "keyFrames");
		}) } : {},
		...Array.isArray(input.transformations) ? { transformations: transformations.map((transformation) => upgradeTransformation(transformation, keyFramesByVariable)) } : {}
	};
}
// ../../packages/config/src/parse/parse-graphic-config.ts
const VARIABLE_VALUE_PARSERS = {
	number: finiteNumber,
	boolean,
	text: string
};
const FRAME_VALUE_PARSERS = {
	translate: point,
	scale: point,
	rotate: finiteNumber,
	"stroke-width": finiteNumber,
	opacity: (value, path, issues) => {
		const result = finiteNumber(value, path, issues);
		if (result === INVALID) return INVALID;
		return result >= 0 && result <= 1 ? result : issues.add(path, "Opacity must be between 0 and 1", "config.opacityRange");
	},
	"fill-color": nonEmptyString,
	"stroke-color": nonEmptyString,
	text: string,
	"image-url": string,
	"motion-path": (value, path, issues) => {
		const result = finiteNumber(value, path, issues);
		if (result === INVALID) return INVALID;
		return result >= 0 && result <= 100 ? result : issues.add(path, "Path position must be between 0 and 100 (percent)", "config.pathPositionRange");
	}
};
/**
* Position (`at`) of a frame: a number within the range or `$min`/`$max` for number variables,
* `false`/`true` for boolean variables, any text for text variables.
*/
function parseFramePosition(value, path, issues, variable) {
	if (value === void 0 || value === null) return issues.add(path, "Missing frame position", "config.missingFramePosition");
	if (variable.type === "number") {
		if (value === RANGE_ENDS.min || value === RANGE_ENDS.max) return value;
		if (typeof value !== "number") return issues.add(path, `Expected a number, ${RANGE_ENDS.min} or ${RANGE_ENDS.max}`, "config.expectedFramePosition", {
			min: RANGE_ENDS.min,
			max: RANGE_ENDS.max
		});
		const at = finiteNumber(value, path, issues);
		if (at === INVALID) return INVALID;
		if (at < variable.minimum || at > variable.maximum) return issues.add(path, `Position must be between ${String(variable.minimum)} and ${String(variable.maximum)}`, "config.positionRange", {
			minimum: variable.minimum,
			maximum: variable.maximum
		});
		return at;
	}
	return VARIABLE_VALUE_PARSERS[variable.type](value, path, issues);
}
function parseVariable(value, path, issues, names) {
	const input = record(value, path, issues);
	if (input === INVALID) return INVALID;
	const name = nonEmptyString(input.name, joinPath(path, "name"), issues);
	const type = oneOf(VARIABLE_TYPES, input.type, joinPath(path, "type"), issues);
	if (name === INVALID || type === INVALID) return INVALID;
	if (names.has(name)) return issues.add(joinPath(path, "name"), `Duplicate variable name: ${name}`, "config.duplicateVariable", { name });
	const parseValue = VARIABLE_VALUE_PARSERS[type];
	const defaultValue = optional(input.defaultValue, (v) => parseValue(v, joinPath(path, "defaultValue"), issues));
	if (defaultValue === INVALID) return INVALID;
	const common = {
		name,
		...defaultValue === void 0 ? {} : { defaultValue }
	};
	let result;
	if (type === "number") {
		const minimum = finiteNumber(input.minimum, joinPath(path, "minimum"), issues);
		const maximum = finiteNumber(input.maximum, joinPath(path, "maximum"), issues);
		if (minimum === INVALID || maximum === INVALID) return INVALID;
		if (minimum > maximum) return issues.add(joinPath(path, "maximum"), "Maximum must not be less than minimum", "config.maximumBelowMinimum");
		result = {
			...common,
			type,
			minimum,
			maximum
		};
	} else result = {
		...common,
		type
	};
	names.add(name);
	return result;
}
function parseFrames(value, path, issues, type, variable) {
	if (value === void 0 || value === null) return [];
	if (!Array.isArray(value)) return expectedType(issues, path, "array", value);
	const parseValue = FRAME_VALUE_PARSERS[type];
	const result = [];
	const taken = /* @__PURE__ */ new Map();
	let valid = true;
	for (const [index, entry] of value.entries()) {
		const framePath = joinPath(path, String(index));
		const frame = record(entry, framePath, issues);
		if (frame === INVALID) {
			valid = false;
			continue;
		}
		const at = parseFramePosition(frame.at, joinPath(framePath, "at"), issues, variable);
		const parsedValue = frame.value === null ? null : parseValue(frame.value, joinPath(framePath, "value"), issues);
		const easing = optional(frame.easing, (v) => oneOf(EASING_NAMES, v, joinPath(framePath, "easing"), issues));
		const label = optional(frame.label, (v) => string(v, joinPath(framePath, "label"), issues));
		if (at === INVALID || parsedValue === INVALID || easing === INVALID || label === INVALID) {
			valid = false;
			continue;
		}
		const position = resolveFramePosition(variable, at);
		const other = taken.get(position);
		if (other !== void 0) {
			issues.add(joinPath(framePath, "at"), `Frame ${String(other)} is already at this position`, "config.framePositionTaken", { frame: other });
			valid = false;
			continue;
		}
		taken.set(position, index);
		result.push({
			at,
			value: parsedValue,
			...easing === void 0 ? {} : { easing },
			...label === void 0 || label === "" ? {} : { label }
		});
	}
	return valid ? result : INVALID;
}
function parseTransition(value, path, issues) {
	const input = record(value, path, issues);
	if (input === INVALID) return INVALID;
	const duration = finiteNumber(input.duration, joinPath(path, "duration"), issues);
	const easing = oneOf(EASING_NAMES, input.easing ?? "linear", joinPath(path, "easing"), issues);
	if (duration === INVALID || easing === INVALID) return INVALID;
	if (duration < 0) return issues.add(joinPath(path, "duration"), "Duration must not be negative", "config.negativeDuration");
	return {
		duration,
		easing
	};
}
function parseAnchor(value, path, issues) {
	return typeof value === "string" ? oneOf(ANCHOR_NAMES, value, path, issues) : point(value, path, issues);
}
/** Accepts `true` and the legacy editor export value `"value"`. */
function parseBind(value, path, issues) {
	if (value === "value") return true;
	return boolean(value, path, issues);
}
/** `path` is required for `motion-path` and not used by other types. */
function parsePathOption(type, value, path, issues) {
	if (type !== "motion-path") return void 0;
	if (value === void 0 || value === null) return issues.add(path, "Missing path element for motion-path", "config.missingMotionPath");
	return nonEmptyString(value, path, issues);
}
function parseTransformation(value, path, issues, variables) {
	const input = record(value, path, issues);
	if (input === INVALID) return INVALID;
	const type = oneOf(TRANSFORMATION_TYPES, input.type, joinPath(path, "type"), issues);
	const element = nonEmptyString(input.element, joinPath(path, "element"), issues);
	const variableName = nonEmptyString(input.variable, joinPath(path, "variable"), issues);
	if (type === INVALID || element === INVALID || variableName === INVALID) return INVALID;
	const variable = variables.get(variableName);
	if (!variable) return issues.add(joinPath(path, "variable"), `Unknown variable: ${variableName}`, "config.unknownVariable", { name: variableName });
	const at = (key) => joinPath(path, key);
	const name = optional(input.name, (v) => nonEmptyString(v, at("name"), issues));
	const frames = parseFrames(input.frames, at("frames"), issues, type, variable);
	const fallback = optional(input.default, (v) => FRAME_VALUE_PARSERS[type](v, at("default"), issues));
	const priority = optional(input.priority, (v) => finiteNumber(v, at("priority"), issues));
	const transition = optional(input.transition, (v) => parseTransition(v, at("transition"), issues));
	const bind = optional(input.bind, (v) => parseBind(v, at("bind"), issues));
	const origin = optional(input.origin, (v) => parseAnchor(v, at("origin"), issues));
	const pathId = parsePathOption(type, input.path, at("path"), issues);
	const orient = type === "motion-path" ? optional(input.orient, (v) => boolean(v, at("orient"), issues)) : void 0;
	if (name === INVALID || frames === INVALID || fallback === INVALID || priority === INVALID || transition === INVALID || bind === INVALID || origin === INVALID || pathId === INVALID || orient === INVALID) return INVALID;
	return {
		type,
		element,
		variable: variableName,
		frames,
		...fallback === void 0 ? {} : { default: fallback },
		...name === void 0 ? {} : { name },
		...priority === void 0 ? {} : { priority },
		...transition === void 0 ? {} : { transition },
		...bind === true ? { bind } : {},
		...origin === void 0 ? {} : { origin },
		...pathId === void 0 ? {} : { path: pathId },
		...orient === true ? { orient } : {}
	};
}
function parseElement(value, path, issues, ids) {
	const input = record(value, path, issues);
	if (input === INVALID) return INVALID;
	const id = nonEmptyString(input.id, joinPath(path, "id"), issues);
	if (id === INVALID) return INVALID;
	if (ids.has(id)) return issues.add(joinPath(path, "id"), `Duplicate element id: ${id}`, "config.duplicateId", { id });
	const name = optional(input.name, (v) => nonEmptyString(v, joinPath(path, "name"), issues));
	if (name === INVALID) return INVALID;
	const eventsPath = joinPath(path, "events");
	const before = issues.issues.length;
	const events = list(input.events, eventsPath, issues, (v, p) => nonEmptyString(v, p, issues));
	if (issues.issues.length > before) return INVALID;
	ids.add(id);
	return {
		id,
		...name === void 0 ? {} : { name },
		...events.length ? { events } : {}
	};
}
function parseSettings(value, path, issues) {
	const input = record(value, path, issues);
	if (input === INVALID) return INVALID;
	const mode = optional(input.mode, (v) => oneOf(MODES, v, joinPath(path, "mode"), issues));
	const imageRendering = optional(input.imageRendering, (v) => oneOf(IMAGE_RENDERINGS, v, joinPath(path, "imageRendering"), issues));
	if (mode === INVALID || imageRendering === INVALID) return INVALID;
	return {
		...mode === void 0 ? {} : { mode },
		...imageRendering === void 0 ? {} : { imageRendering }
	};
}
const EMPTY_CONFIG = Object.freeze({
	variables: [],
	transformations: []
});
/**
* Validates a graphic configuration (already parsed JSON) and normalizes legacy editor output.
* Invalid variables, transformations and elements are dropped as a whole and reported in `issues`;
* transformations referencing a dropped or unknown variable are dropped as well.
*/
function parseGraphicConfig(input) {
	const issues = new IssueCollector();
	const root = record(upgradeGraphicConfig(input), "", issues);
	if (root === INVALID) return {
		config: EMPTY_CONFIG,
		issues: issues.issues
	};
	const variableNames = /* @__PURE__ */ new Set();
	const variables = list(root.variables, "variables", issues, (v, p) => parseVariable(v, p, issues, variableNames));
	const variablesByName = new Map(variables.map((variable) => [variable.name, variable]));
	const transformations = list(root.transformations, "transformations", issues, (v, p) => parseTransformation(v, p, issues, variablesByName));
	const elementIds = /* @__PURE__ */ new Set();
	const elements = list(root.elements, "elements", issues, (v, p) => parseElement(v, p, issues, elementIds));
	const settings = optional(root.settings, (v) => parseSettings(v, "settings", issues));
	return {
		config: {
			variables,
			transformations,
			...elements.length ? { elements } : {},
			...settings === void 0 || settings === INVALID ? {} : { settings }
		},
		issues: issues.issues
	};
}
/** Parses JSON text; syntax errors are reported as an issue with an empty configuration. */
function parseGraphicConfigJson(text) {
	let input;
	try {
		input = JSON.parse(text);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return {
			config: EMPTY_CONFIG,
			issues: [{
				path: "",
				message: `Invalid JSON: ${message}`,
				code: "config.invalidJson",
				params: { message }
			}]
		};
	}
	return parseGraphicConfig(input);
}
// ../../.claude/skills/cuttleskin-graphic/scripts/validate.ts
/**
* Checks a cuttleskin graphic: SVG plus configuration.
*
*   pnpm --filter @cuttleskin/portal-api exec tsx ../../.claude/skills/cuttleskin-graphic/scripts/validate.ts \
*     <graphic.svg> <graphic.config.json>
*
* Runs with the tsx of the portal API. Relative file paths are resolved against the directory pnpm
* was started in (INIT_CWD), usually the repository root.
*
* - Configuration against the schema of `@cuttleskin/config` (the same check the portal API runs)
* - SVG: size limit of the portal, `<svg>` as root element, duplicate IDs
* - Every element referenced by a transformation or in `elements` exists as ID in the SVG
* - Hints for common mistakes (see SKILL.md, "Fallstricke")
*
* Exit code 1 if there are errors; warnings alone do not fail.
*/
/** Same limit as the portal API (`MAX_SVG_BYTES`). */
const MAX_SVG_BYTES = 1048576;
const [svgPath, configPath] = process.argv.slice(2);
if (!svgPath || !configPath) {
	console.error("Usage: validate.ts <graphic.svg> <graphic.config.json>");
	process.exit(2);
}
const base = process.env.INIT_CWD ?? process.cwd();
const svg = await readFile(resolve(base, svgPath), "utf8");
const configText = await readFile(resolve(base, configPath), "utf8");
const errors = [];
const warnings = [];
if (Buffer.byteLength(svg, "utf8") > MAX_SVG_BYTES) errors.push(`svg: larger than ${String(MAX_SVG_BYTES)} bytes`);
const withoutProlog = svg.replace(/<\?xml[\s\S]*?\?>/g, "").replace(/<!--[\s\S]*?-->/g, "").replace(/<!doctype[\s\S]*?>/gi, "").trimStart();
if (!/^<svg[\s>/]/.test(withoutProlog)) errors.push("svg: root element must be <svg>");
if (!/viewBox\s*=/.test(svg)) warnings.push("svg: no viewBox; the graphic will not scale");
if (/<script[\s>]/i.test(svg) || /\son[a-z]+\s*=/i.test(svg)) errors.push("svg: contains <script> or on* event handler attributes; not allowed");
/** Opening tags with an id attribute: id -> tag source. */
const tags = /* @__PURE__ */ new Map();
const duplicates = /* @__PURE__ */ new Set();
const markup = svg.replace(/<!--[\s\S]*?-->/g, "");
for (const match of markup.matchAll(/<([a-zA-Z][\w:-]*)\b[^>]*?\sid\s*=\s*(["'])(.*?)\2[^>]*>/g)) {
	const id = match[3] ?? "";
	if (tags.has(id)) duplicates.add(id);
	tags.set(id, match[0]);
}
for (const id of duplicates) errors.push(`svg: duplicate id "${id}"`);
const { config, issues } = parseGraphicConfigJson(configText);
for (const issue of issues) errors.push(`config${issue.path ? `.${issue.path}` : ""}: ${issue.message}`);
try {
	const raw = JSON.parse(configText);
	const variables = typeof raw === "object" && raw !== null && "variables" in raw ? raw.variables : [];
	if (Array.isArray(variables)) variables.forEach((entry, index) => {
		if (typeof entry === "object" && entry !== null && "keyFrames" in entry) errors.push(`config.variables[${String(index)}]: "keyFrames" is no longer supported; list the frames of each transformation with their position "at"`);
	});
	const list = typeof raw === "object" && raw !== null && "transformations" in raw ? raw.transformations : [];
	if (Array.isArray(list)) list.forEach((entry, index) => {
		if (typeof entry !== "object" || entry === null) return;
		const at = `config.transformations[${String(index)}]`;
		if ("center" in entry) errors.push(`${at}: "center" was renamed to "origin"`);
		if ("frames" in entry && !Array.isArray(entry.frames) && entry.frames !== null) errors.push(`${at}: "frames" must be a list like [{ "at": "$min", "value": … }]; named frames are no longer supported`);
		if ("axis" in entry) errors.push(`${at}: "axis" is no longer supported; put the neutral value (translate 0, scale 1) into the frames`);
	});
} catch {}
/** CSS property written by each transformation type (for the inline style hint). */
const STYLE_PROPERTY = {
	"fill-color": "fill",
	"stroke-color": "stroke",
	"stroke-width": "stroke-width",
	opacity: "opacity"
};
for (const transformation of config.transformations) {
	const at = `transformation "${transformation.name ?? `${transformation.type} ${transformation.element}`}"`;
	const tag = tags.get(transformation.element);
	if (tag === void 0) {
		errors.push(`${at}: element "${transformation.element}" does not exist in the SVG`);
		continue;
	}
	const tagName = /^<([\w:-]+)/.exec(tag)?.[1] ?? "";
	if (transformation.type === "text" && ![
		"text",
		"tspan",
		"textPath"
	].includes(tagName)) warnings.push(`${at}: type text on <${tagName}>; use a <text> or <tspan> element`);
	if (transformation.type === "image-url" && tagName !== "image") warnings.push(`${at}: type image-url on <${tagName}>; use an <image> element`);
	if (transformation.bind && !["text", "image-url"].includes(transformation.type)) warnings.push(`${at}: bind only works for text and image-url`);
	if (transformation.frames.length === 0 && !transformation.bind && transformation.default === void 0) warnings.push(`${at}: no frames, no default and no bind; the transformation has no effect`);
	if (transformation.type === "motion-path" && transformation.path !== void 0) {
		const pathTag = tags.get(transformation.path);
		const pathTagName = pathTag === void 0 ? "" : /^<([\w:-]+)/.exec(pathTag)?.[1] ?? "";
		if (pathTag === void 0) errors.push(`${at}: path "${transformation.path}" does not exist in the SVG`);
		else if (![
			"path",
			"line",
			"polyline",
			"polygon",
			"circle",
			"ellipse",
			"rect"
		].includes(pathTagName)) errors.push(`${at}: path "${transformation.path}" is a <${pathTagName}>, not a shape`);
		else if (transformation.path === transformation.element) errors.push(`${at}: an element cannot follow itself`);
	}
	if (transformation.type === "rotate" && transformation.origin === void 0) warnings.push(`${at}: rotate without origin turns around the bounding box center; set the pivot explicitly`);
	const property = STYLE_PROPERTY[transformation.type];
	if (property && new RegExp(`style\\s*=\\s*["'][^"']*\\b${property}\\s*:[^"']*!important`).test(tag)) errors.push(`${at}: element sets ${property} with !important in its style attribute; the runtime cannot override it`);
}
for (const element of config.elements ?? []) if (!tags.has(element.id)) errors.push(`config.elements: element "${element.id}" does not exist in the SVG`);
const used = new Set(config.transformations.map((transformation) => transformation.variable));
for (const variable of config.variables) if (!used.has(variable.name)) warnings.push(`config.variables: "${variable.name}" drives no transformation`);
for (const message of errors) console.log(`ERROR    ${message}`);
for (const message of warnings) console.log(`WARNING  ${message}`);
console.log(`\n${String(config.variables.length)} variables, ${String(config.transformations.length)} transformations, ${String(tags.size)} SVG elements with id: ${String(errors.length)} errors, ${String(warnings.length)} warnings`);
process.exit(errors.length > 0 ? 1 : 0);
export {};
