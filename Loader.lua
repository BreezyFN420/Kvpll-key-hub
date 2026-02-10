-- Evade Hub v2 Loader
-- Load with: loadstring(game:HttpGet('https://raw.githubusercontent.com/BreezyFN420/Kvpll-key-hub/main/Loader.lua'))()

local function Log(msg)
    print("[Evade Hub] " .. msg)
end

Log("🌙 Starting loader...")

-- URL to main script (raw GitHub content)
local SCRIPT_URL = "https://raw.githubusercontent.com/BreezyFN420/Kvpll-key-hub/main/Evade_Hub_WITH_KEYSYSTEM.lua"

local success, result = pcall(function()
    Log("📥 Downloading main script...")
    local scriptContent = game:HttpGet(SCRIPT_URL)
    if not scriptContent or scriptContent == "" then
        error("Downloaded content is empty")
    end
    Log("✅ Script downloaded (" .. tostring(#scriptContent) .. " bytes)")
    return scriptContent
end)

if not success then
    Log("❌ Download failed: " .. tostring(result))
    warn("Make sure HttpGet is enabled in your executor settings.")
    return
end

Log("⚙️ Executing script...")

-- Execute the downloaded script with error handling
local executeSuccess, executeError = pcall(function()
    loadstring(result)()
end)

if not executeSuccess then
    Log("❌ Execution error: " .. tostring(executeError))
    warn("Full error: " .. tostring(executeError))
else
    Log("✨ Evade Hub loaded successfully!")
end
