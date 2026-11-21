-- Example Roblox Luau script for AZT Obfuscator Azure v1.0.0
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local superSecretAdminKey: string = "AZT-AZURE-999"
local myHiddenMultiplier: number = 42

local function calculateReward(basePoints: number, bonus: number): number
    local total = basePoints * myHiddenMultiplier + bonus
    if total > 1000 then
        total += 250
    else
        total = if total < 0 then 0 else total + 10
    end
    return total
end

local results = {}
for i = 1, 5 do
    results[i] = calculateReward(i * 10, 5)
end

local localPlayer = Players.LocalPlayer
if localPlayer then
    print("Welcome", localPlayer.Name, results[5])
end

return results
