import { verifyJWT } from '../../../lib/auth'
import clientPromise from '../../../lib/mongodb'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const payload = verifyJWT(token)
    const { serviceId } = req.query
    
    const client = await clientPromise
    const db = client.db('keyauth_hub')

    const service = await db.collection('services').findOne({ id: serviceId })
    if (!service) {
      return res.status(404).json({ message: 'Service not found' })
    }

    if (!payload.isAdmin && service.owner_email !== payload.email) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL

    const luaCode = `local ScreenGui = Instance.new("ScreenGui")
local Main = Instance.new("Frame")
local UICorner = Instance.new("UICorner")
local TopBar = Instance.new("Frame")
local UICorner_2 = Instance.new("UICorner")
local Title = Instance.new("TextLabel")
local Close = Instance.new("TextButton")
local UICorner_3 = Instance.new("UICorner")
local Content = Instance.new("Frame")
local KeyContainer = Instance.new("Frame")
local UICorner_4 = Instance.new("UICorner")
local Key = Instance.new("TextBox")
local UIStroke = Instance.new("UIStroke")
local Verify = Instance.new("TextButton")
local UICorner_5 = Instance.new("UICorner")
local UIStroke_2 = Instance.new("UIStroke")
local Status = Instance.new("TextLabel")

-- Services
local HttpService = game:GetService("HttpService")
local TweenService = game:GetService("TweenService")

-- ScreenGui
ScreenGui.Parent = game:GetService("CoreGui")
ScreenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
ScreenGui.Name = "KeyAuthMiniHubUI"

-- Main Frame
Main.Parent = ScreenGui
Main.BackgroundColor3 = Color3.fromRGB(20, 20, 20)
Main.BorderSizePixel = 0
Main.Position = UDim2.new(0.5, -175, 0.5, -125)
Main.Size = UDim2.new(0, 350, 0, 250)
Main.Active = true
Main.Draggable = true

UICorner.Parent = Main
UICorner.CornerRadius = UDim.new(0, 12)

-- Top Bar
TopBar.Parent = Main
TopBar.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
TopBar.BorderSizePixel = 0
TopBar.Size = UDim2.new(1, 0, 0, 40)

UICorner_2.Parent = TopBar
UICorner_2.CornerRadius = UDim.new(0, 12)

-- Title
Title.Parent = TopBar
Title.BackgroundTransparency = 1
Title.Position = UDim2.new(0, 15, 0, 0)
Title.Size = UDim2.new(0, 200, 1, 0)
Title.Font = Enum.Font.GothamBold
Title.Text = "KeyAuthMiniHub"
Title.TextColor3 = Color3.fromRGB(56, 139, 253)
Title.TextSize = 16
Title.TextXAlignment = Enum.TextXAlignment.Left

-- Close Button
Close.Parent = TopBar
Close.BackgroundColor3 = Color3.fromRGB(232, 72, 85)
Close.BorderSizePixel = 0
Close.Position = UDim2.new(1, -30, 0.5, -10)
Close.Size = UDim2.new(0, 20, 0, 20)
Close.Font = Enum.Font.GothamBold
Close.Text = "×"
Close.TextColor3 = Color3.fromRGB(255, 255, 255)
Close.TextSize = 18
Close.ZIndex = 2

UICorner_3.Parent = Close
UICorner_3.CornerRadius = UDim.new(0, 6)

-- Content Area
Content.Parent = Main
Content.BackgroundTransparency = 1
Content.Position = UDim2.new(0, 0, 0, 50)
Content.Size = UDim2.new(1, 0, 1, -50)

-- Key Container
KeyContainer.Parent = Content
KeyContainer.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
KeyContainer.BorderSizePixel = 0
KeyContainer.Position = UDim2.new(0.1, 0, 0.2, 0)
KeyContainer.Size = UDim2.new(0.8, 0, 0, 45)

UICorner_4.Parent = KeyContainer
UICorner_4.CornerRadius = UDim.new(0, 8)

-- Key Input
Key.Parent = KeyContainer
Key.BackgroundTransparency = 1
Key.Position = UDim2.new(0, 15, 0, 0)
Key.Size = UDim2.new(1, -30, 1, 0)
Key.Font = Enum.Font.Gotham
Key.PlaceholderText = "Enter your license key..."
Key.PlaceholderColor3 = Color3.fromRGB(140, 140, 140)
Key.Text = ""
Key.TextColor3 = Color3.fromRGB(255, 255, 255)
Key.TextSize = 14
Key.TextXAlignment = Enum.TextXAlignment.Left

UIStroke.Parent = KeyContainer
UIStroke.Color = Color3.fromRGB(60, 60, 60)
UIStroke.Thickness = 2

-- Verify Button
Verify.Parent = Content
Verify.BackgroundColor3 = Color3.fromRGB(56, 139, 253)
Verify.BorderSizePixel = 0
Verify.Position = UDim2.new(0.2, 0, 0.55, 0)
Verify.Size = UDim2.new(0.6, 0, 0, 40)
Verify.Font = Enum.Font.GothamBold
Verify.Text = "Verify Key"
Verify.TextColor3 = Color3.fromRGB(255, 255, 255)
Verify.TextSize = 14
Verify.AutoButtonColor = false

UICorner_5.Parent = Verify
UICorner_5.CornerRadius = UDim.new(0, 8)

UIStroke_2.Parent = Verify
UIStroke_2.Color = Color3.fromRGB(35, 90, 180)
UIStroke_2.Thickness = 2

-- Status Label
Status.Parent = Content
Status.BackgroundTransparency = 1
Status.Position = UDim2.new(0, 0, 0.8, 0)
Status.Size = UDim2.new(1, 0, 0, 20)
Status.Font = Enum.Font.Gotham
Status.TextColor3 = Color3.fromRGB(255, 255, 255)
Status.TextSize = 12
Status.Text = ""
Status.Visible = false

-- Animation functions
local function AnimateButtonHover(button)
    local originalColor = button.BackgroundColor3
    local hoverColor = Color3.fromRGB(66, 149, 263)
    
    button.MouseEnter:Connect(function()
        TweenService:Create(button, TweenInfo.new(0.2), {BackgroundColor3 = hoverColor}):Play()
    end)
    
    button.MouseLeave:Connect(function()
        TweenService:Create(button, TweenInfo.new(0.2), {BackgroundColor3 = originalColor}):Play()
    end)
end

local function AnimateButtonClick(button)
    button.MouseButton1Down:Connect(function()
        TweenService:Create(button, TweenInfo.new(0.1), {Size = UDim2.new(0.58, 0, 0, 38)}):Play()
    end)
    
    button.MouseButton1Up:Connect(function()
        TweenService:Create(button, TweenInfo.new(0.1), {Size = UDim2.new(0.6, 0, 0, 40)}):Play()
    end)
end

-- Apply animations
AnimateButtonHover(Verify)
AnimateButtonClick(Verify)

-- Close button animations
Close.MouseEnter:Connect(function()
    TweenService:Create(Close, TweenInfo.new(0.2), {BackgroundColor3 = Color3.fromRGB(210, 60, 70)}):Play()
end)

Close.MouseLeave:Connect(function()
    TweenService:Create(Close, TweenInfo.new(0.2), {BackgroundColor3 = Color3.fromRGB(232, 72, 85)}):Play()
end)

-- Main functions
local function GetHardwareId()
    local Success, ClientId = pcall(function()
        return game:GetService("RbxAnalyticsService"):GetClientId()
    end)
    return Success and ClientId or "HWID_ERROR"
end

local function IsRequestHooked()
    local Adapters = {}
    if syn and type(syn.request) == "function" then
        table.insert(Adapters, syn.request)
    end
    if type(http_request) == "function" then
        table.insert(Adapters, http_request)
    end
    if type(http) == "table" and type(http.request) == "function" then
        table.insert(Adapters, http.request)
    end
    if #Adapters == 0 then
        return true
    end
    for _, Adapter in ipairs(Adapters) do
        if type(Adapter) == "function" then
            local InfoOk, Info = pcall(function() return debug.getinfo(Adapter) end)
            if InfoOk and Info and Info.what and Info.what ~= "C" then
            end
            local S = tostring(Adapter)
            if not (S:find("function: 0x") or S:find("function: 0X")) then
            end
            local Ok, Resp = pcall(function()
                local SuccessCall, Result = pcall(Adapter, {Url = "https://httpbin.org/get?check=" .. tostring(math.random(111111,999999)), Method = "GET"})
                if SuccessCall and Result then return Result end
                SuccessCall, Result = pcall(Adapter, {url = "https://httpbin.org/get?check=" .. tostring(math.random(111111,999999)), method = "GET"})
                if SuccessCall and Result then return Result end
                SuccessCall, Result = pcall(Adapter, "https://httpbin.org/get?check=" .. tostring(math.random(111111,999999)))
                if SuccessCall and Result then return Result end
                return nil
            end)
            if Ok and Resp then
                if type(Resp) == "table" and (Resp.Body or Resp.body) then
                    return false
                elseif type(Resp) == "string" then
                    return false
                end
            end
        end
    end
    return true
end

local function VerifyKey(Key)
    if not http and not syn and not http_request or IsRequestHooked() then
        return false, "Executor Not Supported"
    end
    local Success, Message = false, "Unknown Error"
    local Body = HttpService:JSONEncode({
        Key = Key,
        HWID = GetHardwareId(),
        ServiceId = "${serviceId}"
    })
    local Request = pcall(function()
        local Response
        if syn and syn.request then
            Response = syn.request({
                Url = "${backendUrl}/api/verify-key",
                Method = "POST",
                Headers = {["Content-Type"] = "application/json"},
                Body = Body
            })
        elseif http_request then
            Response = http_request({
                Url = "${backendUrl}/api/verify-key",
                Method = "POST",
                Headers = {["Content-Type"] = "application/json"},
                Body = Body
            })
        elseif http and http.request then
            Response = http.request({
                Url = "${backendUrl}/api/verify-key",
                Method = "POST",
                Headers = {["Content-Type"] = "application/json"},
                Body = Body
            })
        else
            error("No Supported HTTP Method Found")
        end
        if Response and Response.StatusCode == 200 then
            local Decode, Data = pcall(HttpService.JSONDecode, HttpService, Response.Body)
            if Decode and type(Data) == "table" then
                Success = Data.success or false
                Message = Data.success and "Valid Key" or (Data.error or "Invalid Key")
            else
                Message = "Invalid Response"
            end
        else
            Message = "Connection Error"
        end
    end)
    if not Request then
        return false, "Executor Not Supported"
    end
    return Success, Message
end

local function Verification(Success, Message)
    Status.Text = Message
    Status.TextColor3 = Success and Color3.fromRGB(85, 255, 127) or Color3.fromRGB(255, 85, 85)
    Status.Visible = true
    
    if Success then
        Verify.Text = "Success!"
        Verify.BackgroundColor3 = Color3.fromRGB(85, 255, 127)
        task.wait(1.5)
        ScreenGui:Destroy()
        -- Your Script Here
        print("Key verified successfully! Loading script...")
    else
        task.wait(2)
        Status.Visible = false
        Key.Text = ""
        Verify.Text = "Verify Key"
        Verify.BackgroundColor3 = Color3.fromRGB(56, 139, 253)
    end
end

Verify.MouseButton1Click:Connect(function()
    local KeyInput = Key.Text
    if KeyInput == "" then
        Status.Text = "Please enter a key"
        Status.TextColor3 = Color3.fromRGB(255, 215, 0)
        Status.Visible = true
        return
    end
    
    Verify.Text = "Verifying..."
    Status.Text = "Verifying key..."
    Status.TextColor3 = Color3.fromRGB(255, 215, 0)
    Status.Visible = true
    
    local Success, Message = VerifyKey(KeyInput)
    Verification(Success, Message)
end)

Close.MouseButton1Click:Connect(function()
    local tween = TweenService:Create(Main, TweenInfo.new(0.3), {
        Size = UDim2.new(0, 0, 0, 0),
        Position = UDim2.new(0.5, 0, 0.5, 0)
    })
    tween:Play()
    tween.Completed:Wait()
    ScreenGui:Destroy()
end)

-- Auto focus on textbox
task.spawn(function()
    wait(0.5)
    Key:CaptureFocus()
end)`

    res.json({ lua_code: luaCode })
  } catch (error) {
    console.error('Library API error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
