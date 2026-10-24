--!strict

local SUFFIXES = {
	"",
	"K",
	"M",
	"B",
	"T",
	"Qa",
	"Qi",
	"Sx",
	"Sp",
	"Oc",
	"No",
	"Dc",
}

local NumbersUtil = {}

function NumbersUtil.FormatCompact(value: number): string
	if value < 0 then
		return "-" .. NumbersUtil.FormatCompact(-value)
	end
	if value < 1000 then
		return string.format("%d", math.floor(value))
	end

	local order = math.floor(math.log(value, 10) / 3)
	local suffixIndex = order + 1

	if suffixIndex > #SUFFIXES then
		suffixIndex = #SUFFIXES
	end

	local scaled = value / (10 ^ (order * 3))
	local formatted: string

	if scaled >= 100 then
		formatted = string.format("%.0f", scaled)
	elseif scaled >= 10 then
		formatted = string.format("%.1f", scaled)
	else
		formatted = string.format("%.2f", scaled)
	end

	-- Strip trailing zeroes after decimal point if present
	formatted = string.gsub(formatted, "%.00$", "")
	formatted = string.gsub(formatted, "(%..-)0+$", "%1")
	formatted = string.gsub(formatted, "%.$", "")

	return formatted .. SUFFIXES[suffixIndex]
end

function NumbersUtil.FormatWithCommas(value: number): string
	local formatted = tostring(math.floor(math.abs(value)))
	local k: number
	while true do
		formatted, k = string.gsub(formatted, "^(-?%d+)(%d%d%d)", "%1,%2")
		if k == 0 then
			break
		end
	end
	return if value < 0 then "-" .. formatted else formatted
end

function NumbersUtil.FormatTime(totalSeconds: number): string
	local seconds = math.max(0, math.floor(totalSeconds))
	local minutes = math.floor(seconds / 60)
	local remainingSeconds = seconds % 60
	return string.format("%02d:%02d", minutes, remainingSeconds)
end

return NumbersUtil
