--// Serviços
local CoreGui = game:GetService("CoreGui")
local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local LocalPlayer = Players.LocalPlayer

--// Carregar a biblioteca redzlib (assumindo que já está carregada)
local redzlib = loadstring(game:HttpGet("https://raw.githubusercontent.com/tbao143/Library-ui/refs/heads/main/Redzhubui"))()

--// Criar janela principal
local Window = redzlib:MakeWindow({
  Title = "AimGodz Hub",
  SubTitle = "by thziin_01",
  SaveFolder = "AimGodzConfig"
})

--// Adicionar botão de minimizar personalizado
Window:AddMinimizeButton({
    Button = { Image = "rbxassetid://71014873973869", BackgroundTransparency = 0 },
    Corner = { CornerRadius = UDim.new(35, 1) },
})

--// Adicionar convite do Discord
Window:AddDiscordInvite({
    Name = "AimGodz Hub",
    Description = "Join our Discord server",
    Logo = "rbxassetid://18751483361",
    Invite = "https://discord.gg/example",
})

--// Definir tema
redzlib:SetTheme("Dark")

--// Criar abas
local TabInicio = Window:MakeTab({"Início", "home"})
local TabCombate = Window:MakeTab({"Combate", "swords"})
local TabVisual = Window:MakeTab({"Visual", "eye"})
local TabConfig = Window:MakeTab({"Configurações", "settings"})

--// Selecionar aba inicial
Window:SelectTab(TabInicio)

--// VARIÁVEIS GLOBAIS
local HitBoxAtivo = false
local HitBoxTamanho = 8
local hitboxes = {}

local FOVAtivo = false
local FOVTamanho = 100
local FOVCircle

local ESPItensAtivo = false
local ESPItensToggle
local verItensConexoes = {}
local ESPs = {}

local ESPLineAtivo = false
local ESPLineBeams = {}
local ESPLineConnections = {}
local ESPLineLocalPart = nil
local ESPLineLocalAttachment = nil

local ESPBox2DAtivo = false
local ESPBox2DDrawings = {}

local ESPNameAtivo = false
local ESPNameBillboards = {}

local ESPVidaAtivo = false
local ESPVidaDrawings = {}

local MostrarFPSPingAtivo = false
local FPSPingUI

local speedAtivo = false
local speedValor = 16

local NoclipAtivo = false
local noclipConnection

local AntiRevistarAtivo = false
local antiRevistarConnection

local AimbotPCAtivo = false
local AimbotMobileAtivo = false
local aimbotMobileConnection

local TPKillAtivo = false
local AutoRevistarAtivo = false
local revistarCoroutine = nil
local detectados = {}

--// SISTEMA HIT BOX CORRIGIDO
local function criarHitBox(player)
	if player == LocalPlayer then return end
	if not player.Character or not player.Character:FindFirstChild("HumanoidRootPart") then return end
	
	local hrp = player.Character.HumanoidRootPart
	local box = Instance.new("BoxHandleAdornment")
	box.Name = "PlayerHitbox"
	box.Adornee = hrp
	box.AlwaysOnTop = true
	box.ZIndex = 5
	box.Color3 = Color3.fromRGB(255, 0, 0)
	box.Transparency = 0.8
	box.Size = Vector3.new(HitBoxTamanho, HitBoxTamanho, HitBoxTamanho)
	box.Parent = CoreGui
	hitboxes[player] = box
end

local function removerHitBox(player)
	if hitboxes[player] then
		hitboxes[player]:Destroy()
		hitboxes[player] = nil
	end
end

local function atualizarHitBoxes()
	for player, box in pairs(hitboxes) do
		if not player.Character or not player.Character:FindFirstChild("HumanoidRootPart") then
			removerHitBox(player)
		else
			box.Size = Vector3.new(HitBoxTamanho, HitBoxTamanho, HitBoxTamanho)
		end
	end
	
	if HitBoxAtivo then
		for _, player in pairs(Players:GetPlayers()) do
			if player ~= LocalPlayer and not hitboxes[player] then
				criarHitBox(player)
			end
		end
	end
end

local function limparTodasHitBoxes()
	for player, box in pairs(hitboxes) do
		box:Destroy()
	end
	hitboxes = {}
end

--// SISTEMA FOV
local function criarFOV()
    if FOVCircle then
        FOVCircle:Destroy()
        FOVCircle = nil
    end
    
    local camera = workspace.CurrentCamera
    local viewportSize = camera.ViewportSize
    
    FOVCircle = Instance.new("Frame")
    FOVCircle.Name = "FOVCircle"
    FOVCircle.Size = UDim2.new(0, FOVTamanho, 0, FOVTamanho)
    FOVCircle.Position = UDim2.new(0.5, -FOVTamanho/2, 0.5, -FOVTamanho/2)
    FOVCircle.BackgroundTransparency = 1
    FOVCircle.BorderSizePixel = 0
    FOVCircle.Parent = CoreGui
    
    local UICorner = Instance.new("UICorner")
    UICorner.CornerRadius = UDim.new(1, 0)
    UICorner.Parent = FOVCircle
    
    local UIStroke = Instance.new("UIStroke")
    UIStroke.Color = Color3.fromRGB(255, 100, 100)
    UIStroke.Thickness = 2
    UIStroke.Transparency = 0.3
    UIStroke.Parent = FOVCircle
end

local function atualizarFOV()
    if not FOVAtivo then
        if FOVCircle then
            FOVCircle:Destroy()
            FOVCircle = nil
        end
        return
    end
    
    if not FOVCircle then
        criarFOV()
    else
        FOVCircle.Size = UDim2.new(0, FOVTamanho, 0, FOVTamanho)
        FOVCircle.Position = UDim2.new(0.5, -FOVTamanho/2, 0.5, -FOVTamanho/2)
    end
end

--// SISTEMA ESP ITENS
local function limparESPItens()
    for _, conexao in ipairs(verItensConexoes) do
        conexao:Disconnect()
    end
    verItensConexoes = {}
    
    for _, esp in pairs(ESPs) do
        if esp then
            esp:Destroy()
        end
    end
    ESPs = {}
end

local function iniciarESPItens()
    local Players = game:GetService("Players")
    local verItensUIAtivo = true

    local function adicionarUI(player)
        if player == Players.LocalPlayer then return end
        if ESPs[player] then return end

        local function criarBillboard()
            local character = player.Character or player.CharacterAdded:Wait()
            local head = character:WaitForChild("Head", 3)
            if not head then return end

            local gui = Instance.new("BillboardGui")
            gui.Name = "ItemUI"
            gui.Adornee = head
            gui.Size = UDim2.new(0, 160, 0, 60)
            gui.StudsOffset = Vector3.new(0, 2.8, 0)
            gui.AlwaysOnTop = true

            local nameLabel = Instance.new("TextLabel")
            nameLabel.Size = UDim2.new(1, 0, 0.3, 0)
            nameLabel.Position = UDim2.new(0, 0, 0, 0)
            nameLabel.BackgroundTransparency = 1
            nameLabel.TextColor3 = Color3.new(1, 1, 1)
            nameLabel.TextStrokeTransparency = 0.5
            nameLabel.Font = Enum.Font.SourceSansBold
            nameLabel.TextScaled = true
            nameLabel.Text = player.Name
            nameLabel.Parent = gui

            local itensLabel = Instance.new("TextLabel")
            itensLabel.Size = UDim2.new(1, 0, 0.7, 0)
            itensLabel.Position = UDim2.new(0, 0, 0.3, 0)
            itensLabel.BackgroundTransparency = 1
            itensLabel.TextColor3 = Color3.new(1, 1, 1)
            itensLabel.TextStrokeTransparency = 0.6
            itensLabel.Font = Enum.Font.SourceSans
            itensLabel.TextScaled = true
            itensLabel.TextWrapped = true
            itensLabel.Text = ""
            itensLabel.Parent = gui

            local function update()
                local list = {}
                if player:FindFirstChild("Backpack") then
                    for _, item in ipairs(player.Backpack:GetChildren()) do
                        table.insert(list, item.Name)
                    end
                end
                if player.Character then
                    for _, item in ipairs(player.Character:GetChildren()) do
                        if item:IsA("Tool") then
                            table.insert(list, item.Name)
                        end
                    end
                end
                itensLabel.Text = table.concat(list, ", ")
            end

            update()
            table.insert(verItensConexoes, player.Backpack.ChildAdded:Connect(update))
            table.insert(verItensConexoes, player.Backpack.ChildRemoved:Connect(update))
            table.insert(verItensConexoes, player.Character.ChildAdded:Connect(update))
            table.insert(verItensConexoes, player.Character.ChildRemoved:Connect(update))

            gui.Parent = head
            ESPs[player] = gui
        end

        if player.Character then
            criarBillboard()
        end

        player.CharacterAdded:Connect(function()
            task.wait(0.5)
            if verItensUIAtivo then
                if ESPs[player] then
                    ESPs[player]:Destroy()
                    ESPs[player] = nil
                end
                criarBillboard()
            end
        end)
    end

    local function removerUI(player)
        if ESPs[player] then
            ESPs[player]:Destroy()
            ESPs[player] = nil
        end
    end

    for _, player in pairs(Players:GetPlayers()) do
        adicionarUI(player)
    end

    Players.PlayerAdded:Connect(function(player)
        adicionarUI(player)
    end)

    Players.PlayerRemoving:Connect(function(player)
        removerUI(player)
    end)
end

--// SISTEMA ESP LINE
local function ESPLine_rgbColor(t)
    local r = math.floor((math.sin(t * 2) * 0.5 + 0.5) * 255)
    local g = math.floor((math.sin(t * 2 + 2) * 0.5 + 0.5) * 255)
    local b = math.floor((math.sin(t * 2 + 4) * 0.5 + 0.5) * 255)
    return Color3.fromRGB(r, g, b)
end

local function ESPLine_ensureLocalPart()
    if ESPLineLocalPart and ESPLineLocalPart.Parent then return end

    if ESPLineLocalPart and ESPLineLocalPart.Parent then
        pcall(function() ESPLineLocalPart:Destroy() end)
    end

    ESPLineLocalPart = Instance.new("Part")
    ESPLineLocalPart.Name = "ESPLocalAnchor"
    ESPLineLocalPart.Size = Vector3.new(0.2, 0.2, 0.2)
    ESPLineLocalPart.Transparency = 1
    ESPLineLocalPart.Anchored = true
    ESPLineLocalPart.CanCollide = false
    ESPLineLocalPart.Massless = true
    ESPLineLocalPart.Parent = workspace

    ESPLineLocalAttachment = Instance.new("Attachment")
    ESPLineLocalAttachment.Name = "ESP_Local_Attachment"
    ESPLineLocalAttachment.Parent = ESPLineLocalPart
end

local function ESPLine_updateLocalPart()
    local char = LocalPlayer.Character
    if not char then return end
    local hrp = char:FindFirstChild("HumanoidRootPart")
    if not hrp then return end

    local pos = hrp.Position - Vector3.new(0, 3, 0)
    ESPLineLocalPart.CFrame = CFrame.new(pos)
end

local function ESPLine_destroyBeamFor(targetPlayer)
    local info = ESPLineBeams[targetPlayer]
    if not info then return end

    pcall(function()
        if info.beamPart and info.beamPart.Parent then
            info.beamPart:Destroy()
        end
    end)

    if info.createdAttachment and info.attachment1 and info.attachment1.Parent then
        pcall(function() info.attachment1:Destroy() end)
    end

    ESPLineBeams[targetPlayer] = nil
end

local function ESPLine_createBeamFor(targetPlayer)
    if not targetPlayer or targetPlayer == LocalPlayer then return end
    if ESPLineBeams[targetPlayer] then return end

    local char = targetPlayer.Character
    local hrp = (char and char:FindFirstChild("HumanoidRootPart")) and char.HumanoidRootPart or nil
    if not hrp then return end

    local attachName = "ESP_Target_Attachment_ChatGPT"
    local attachment1 = hrp:FindFirstChild(attachName)
    local created = false
    if not attachment1 then
        attachment1 = Instance.new("Attachment")
        attachment1.Name = attachName
        attachment1.Parent = hrp
        created = true
    end

    local beamPart = Instance.new("Part")
    beamPart.Name = "ESP_BeamContainer_" .. targetPlayer.Name
    beamPart.Size = Vector3.new(0.1, 0.1, 0.1)
    beamPart.Transparency = 1
    beamPart.Anchored = true
    beamPart.CanCollide = false
    beamPart.Parent = workspace

    local beam = Instance.new("Beam")
    beam.Name = "ESP_BeamRGB"
    beam.Attachment0 = ESPLineLocalAttachment
    beam.Attachment1 = attachment1
    beam.FaceCamera = true
    beam.Segments = 4
    beam.Width0 = 0.08
    beam.Width1 = 0.08
    beam.Transparency = NumberSequence.new(0)
    beam.TextureMode = Enum.TextureMode.Stretch
    beam.Parent = beamPart

    ESPLineBeams[targetPlayer] = {
        beamPart = beamPart,
        beam = beam,
        attachment1 = attachment1,
        createdAttachment = created
    }
end

local function ESPLine_initAllPlayers()
    for _, plr in pairs(Players:GetPlayers()) do
        if plr ~= LocalPlayer then
            ESPLineConnections[plr] = {}
            ESPLineConnections[plr].charAdded = plr.CharacterAdded:Connect(function(char)
                local hrp = char:WaitForChild("HumanoidRootPart", 5)
                if hrp then
                    ESPLine_createBeamFor(plr)
                end
            end)

            if plr.Character and plr.Character:FindFirstChild("HumanoidRootPart") then
                ESPLine_createBeamFor(plr)
            end

            ESPLineConnections[plr].charRemoving = plr.CharacterRemoving:Connect(function()
                ESPLine_destroyBeamFor(plr)
            end)

            ESPLineConnections[plr].playerRemoving = Players.PlayerRemoving:Connect(function(rem)
                if rem == plr then
                    ESPLine_destroyBeamFor(plr)
                    if ESPLineConnections[plr] then
                        for _, c in pairs(ESPLineConnections[plr]) do
                            if c and typeof(c) == "RBXScriptConnection" then
                                pcall(function() c:Disconnect() end)
                            end
                        end
                        ESPLineConnections[plr] = nil
                    end
                end
            end)
        end
    end
end

local function ESPLine_destroyAll()
    for plr, _ in pairs(ESPLineBeams) do
        ESPLine_destroyBeamFor(plr)
    end
    if ESPLineLocalPart and ESPLineLocalPart.Parent then
        pcall(function() ESPLineLocalPart:Destroy() end)
    end
    for plr, conns in pairs(ESPLineConnections) do
        for _, c in pairs(conns) do
            if c and typeof(c) == "RBXScriptConnection" then
                pcall(function() c:Disconnect() end)
            end
        end
    end
    ESPLineBeams = {}
    ESPLineConnections = {}
end

local function iniciarESPLine()
    ESPLine_ensureLocalPart()
    ESPLine_initAllPlayers()

    Players.PlayerAdded:Connect(function(plr)
        task.defer(function()
            ESPLineConnections[plr] = {}
            ESPLineConnections[plr].charAdded = plr.CharacterAdded:Connect(function(char)
                local hrp = char:WaitForChild("HumanoidRootPart", 5)
                if hrp then
                    ESPLine_createBeamFor(plr)
                end
            end)

            ESPLineConnections[plr].charRemoving = plr.CharacterRemoving:Connect(function()
                ESPLine_destroyBeamFor(plr)
            end)

            ESPLineConnections[plr].playerRemoving = Players.PlayerRemoving:Connect(function(rem)
                if rem == plr then
                    ESPLine_destroyBeamFor(plr)
                    if ESPLineConnections[plr] then
                        for _, c in pairs(ESPLineConnections[plr]) do
                            if c and typeof(c) == "RBXScriptConnection" then
                                pcall(function() c:Disconnect() end)
                            end
                        end
                        ESPLineConnections[plr] = nil
                    end
                end
            end)
        end)
    end)

    Players.PlayerRemoving:Connect(function(plr)
        ESPLine_destroyBeamFor(plr)
        if ESPLineConnections[plr] then
            for _, c in pairs(ESPLineConnections[plr]) do
                if c and typeof(c) == "RBXScriptConnection" then
                    pcall(function() c:Disconnect() end)
                end
            end
            ESPLineConnections[plr] = nil
        end
    end)

    LocalPlayer.CharacterAdded:Connect(function(char)
        task.wait(0.1)
        ESPLine_ensureLocalPart()
        for plr, _ in pairs(ESPLineBeams) do
            ESPLine_destroyBeamFor(plr)
        end
        ESPLine_initAllPlayers()
    end)

    local ESPLineConnection = RunService.RenderStepped:Connect(function(dt)
        if not ESPLineAtivo then return end
        pcall(ESPLine_updateLocalPart)

        local t = tick()
        local color = ESPLine_rgbColor(t)

        for plr, info in pairs(ESPLineBeams) do
            pcall(function()
                if not plr.Parent then
                    ESPLine_destroyBeamFor(plr)
                    return
                end

                if not (info.attachment1 and info.attachment1.Parent) then
                    ESPLine_destroyBeamFor(plr)
                    return
                end

                if info.beam and info.beam.Parent then
                    info.beam.Color = ColorSequence.new(color)
                    info.beam.Width0 = 0.06
                    info.beam.Width1 = 0.06
                end

                if info.beamPart and info.beamPart.Parent and ESPLineLocalPart then
                    info.beamPart.Position = ESPLineLocalPart.Position
                end
            end)
        end
    end)

    table.insert(ESPLineConnections, ESPLineConnection)
end

--// SISTEMA ESP BOX 2D
local function ESPBox2D_CreateFullBodyBox(player)
    if player == LocalPlayer then return end

    local box = Drawing.new("Square")
    box.Color = Color3.fromRGB(255, 0, 0)
    box.Thickness = 2
    box.Filled = false
    box.Visible = false

    ESPBox2DDrawings[player] = box

    local function Update()
        if not ESPBox2DAtivo then
            box.Visible = false
            return
        end

        if not player.Character then
            box.Visible = false
            return
        end

        local hrp = player.Character:FindFirstChild("HumanoidRootPart")
        local humanoid = player.Character:FindFirstChildOfClass("Humanoid")
        if not hrp or not humanoid then
            box.Visible = false
            return
        end

        local parts = {}
        for _, partName in pairs({"Head","UpperTorso","LowerTorso","LeftUpperArm","RightUpperArm","LeftUpperLeg","RightUpperLeg"}) do
            local part = player.Character:FindFirstChild(partName)
            if part then table.insert(parts, part) end
        end

        if #parts == 0 then
            box.Visible = false
            return
        end

        local minX, minY = math.huge, math.huge
        local maxX, maxY = -math.huge, -math.huge

        for _, part in pairs(parts) do
            local corners = {
                part.Position + Vector3.new( part.Size.X/2,  part.Size.Y/2,  part.Size.Z/2),
                part.Position + Vector3.new( part.Size.X/2,  part.Size.Y/2, -part.Size.Z/2),
                part.Position + Vector3.new( part.Size.X/2, -part.Size.Y/2,  part.Size.Z/2),
                part.Position + Vector3.new( part.Size.X/2, -part.Size.Y/2, -part.Size.Z/2),
                part.Position + Vector3.new(-part.Size.X/2,  part.Size.Y/2,  part.Size.Z/2),
                part.Position + Vector3.new(-part.Size.X/2,  part.Size.Y/2, -part.Size.Z/2),
                part.Position + Vector3.new(-part.Size.X/2, -part.Size.Y/2,  part.Size.Z/2),
                part.Position + Vector3.new(-part.Size.X/2, -part.Size.Y/2, -part.Size.Z/2)
            }

            for _, corner in pairs(corners) do
                local screenPos, onScreen = workspace.CurrentCamera:WorldToViewportPoint(corner)
                if onScreen then
                    minX = math.min(minX, screenPos.X)
                    minY = math.min(minY, screenPos.Y)
                    maxX = math.max(maxX, screenPos.X)
                    maxY = math.max(maxY, screenPos.Y)
                end
            end
        end

        if minX < maxX and minY < maxY then
            box.Position = Vector2.new(minX, minY)
            box.Size = Vector2.new(maxX - minX, maxY - minY)
            box.Visible = true
        else
            box.Visible = false
        end
    end

    local conn = RunService.RenderStepped:Connect(Update)
    ESPBox2DDrawings[player].connection = conn

    player.AncestryChanged:Connect(function(_, parent)
        if not parent then
            conn:Disconnect()
            box:Remove()
            ESPBox2DDrawings[player] = nil
        end
    end)
end

local function ESPBox2D_DestroyAll()
    for player, drawing in pairs(ESPBox2DDrawings) do
        if drawing.connection then
            drawing.connection:Disconnect()
        end
        if typeof(drawing) == "Drawing" then
            drawing:Remove()
        end
    end
    ESPBox2DDrawings = {}
end

--// SISTEMA ESP NAME
local function ESPName_CreateNameESP(player)
    if player == LocalPlayer then return end

    local billboard = Instance.new("BillboardGui")
    billboard.Name = player.Name .. "_ESPName"
    billboard.AlwaysOnTop = true
    billboard.Size = UDim2.new(0, 100, 0, 20)
    billboard.StudsOffset = Vector3.new(0, 2.5, 0)
    billboard.Adornee = nil
    billboard.Enabled = false
    billboard.Parent = CoreGui

    local nameLabel = Instance.new("TextLabel")
    nameLabel.Size = UDim2.new(1, 0, 1, 0)
    nameLabel.BackgroundTransparency = 1
    nameLabel.Text = player.Name
    nameLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    nameLabel.TextStrokeTransparency = 0.2
    nameLabel.TextScaled = true
    nameLabel.Font = Enum.Font.GothamBold
    nameLabel.Parent = billboard

    ESPNameBillboards[player] = billboard

    local function Update()
        if not ESPNameAtivo then
            billboard.Enabled = false
            return
        end

        if player.Character and player.Character:FindFirstChild("HumanoidRootPart") then
            local root = player.Character.HumanoidRootPart
            billboard.Adornee = root
            billboard.Enabled = true
        else
            billboard.Enabled = false
        end
    end

    local conn = RunService.RenderStepped:Connect(Update)
    ESPNameBillboards[player].connection = conn

    player.AncestryChanged:Connect(function(_, parent)
        if not parent then
            conn:Disconnect()
            billboard:Destroy()
            ESPNameBillboards[player] = nil
        end
    end)
end

local function ESPName_DestroyAll()
    for player, billboard in pairs(ESPNameBillboards) do
        if billboard.connection then
            billboard.connection:Disconnect()
        end
        billboard:Destroy()
    end
    ESPNameBillboards = {}
end

--// SISTEMA ESP VIDA
local function ESPVida_CreateHealthNumberESP(player)
    if player == LocalPlayer then return end

    local healthText = Drawing.new("Text")
    healthText.Color = Color3.fromRGB(255, 105, 180)
    healthText.Size = 18
    healthText.Center = true
    healthText.Outline = true
    healthText.OutlineColor = Color3.new(0,0,0)
    healthText.Visible = false
    healthText.Font = 2

    ESPVidaDrawings[player] = healthText

    local function Update()
        if not ESPVidaAtivo then
            healthText.Visible = false
            return
        end

        if not player.Character then
            healthText.Visible = false
            return
        end

        local humanoid = player.Character:FindFirstChildOfClass("Humanoid")
        local hrp = player.Character:FindFirstChild("HumanoidRootPart")
        if not humanoid or not hrp then
            healthText.Visible = false
            return
        end

        local pos, onScreen = workspace.CurrentCamera:WorldToViewportPoint(hrp.Position - Vector3.new(0, 3, 0))
        if onScreen and humanoid.Health > 0 then
            healthText.Position = Vector2.new(pos.X, pos.Y)
            healthText.Text = tostring(math.floor(humanoid.Health))
            healthText.Visible = true
        else
            healthText.Visible = false
        end
    end

    local conn = RunService.RenderStepped:Connect(Update)
    ESPVidaDrawings[player].connection = conn

    player.AncestryChanged:Connect(function(_, parent)
        if not parent then
            conn:Disconnect()
            healthText:Remove()
            ESPVidaDrawings[player] = nil
        end
    end)
end

local function ESPVida_DestroyAll()
    for player, drawing in pairs(ESPVidaDrawings) do
        if drawing.connection then
            drawing.connection:Disconnect()
        end
        if typeof(drawing) == "Drawing" then
            drawing:Remove()
        end
    end
    ESPVidaDrawings = {}
end

--// SISTEMA MOSTRAR FPS/PING
local function iniciarFPSPingUI()
    if FPSPingUI then
        FPSPingUI:Destroy()
    end

    local ScreenGui = Instance.new("ScreenGui")
    ScreenGui.Name = "FPSPingUI"
    ScreenGui.IgnoreGuiInset = true
    ScreenGui.ResetOnSpawn = false
    ScreenGui.Enabled = MostrarFPSPingAtivo
    ScreenGui.Parent = CoreGui

    local Frame = Instance.new("Frame")
    Frame.BackgroundColor3 = Color3.fromRGB(20, 20, 20)
    Frame.BackgroundTransparency = 0.6
    Frame.BorderSizePixel = 0
    Frame.Size = UDim2.new(0, 190, 0, 45)
    Frame.Position = UDim2.new(0.75, 0, 0.9, 0)
    Frame.AnchorPoint = Vector2.new(0.5, 0)
    Frame.Parent = ScreenGui
    Frame.Active = true

    local UICorner = Instance.new("UICorner")
    UICorner.CornerRadius = UDim.new(0, 10)
    UICorner.Parent = Frame

    local FPSLabel = Instance.new("TextLabel")
    FPSLabel.BackgroundTransparency = 1
    FPSLabel.TextColor3 = Color3.fromRGB(0, 255, 0)
    FPSLabel.TextScaled = true
    FPSLabel.Font = Enum.Font.Code
    FPSLabel.Text = "FPS: 0"
    FPSLabel.Size = UDim2.new(0.5, 0, 1, 0)
    FPSLabel.Position = UDim2.new(0, 10, 0, 0)
    FPSLabel.TextXAlignment = Enum.TextXAlignment.Left
    FPSLabel.Parent = Frame

    local PingLabel = Instance.new("TextLabel")
    PingLabel.BackgroundTransparency = 1
    PingLabel.TextColor3 = Color3.fromRGB(0, 200, 255)
    PingLabel.TextScaled = true
    PingLabel.Font = Enum.Font.Code
    PingLabel.Text = "Ping: 0 ms"
    PingLabel.Size = UDim2.new(0.5, -10, 1, 0)
    PingLabel.Position = UDim2.new(0.5, 0, 0, 0)
    PingLabel.TextXAlignment = Enum.TextXAlignment.Right
    PingLabel.Parent = Frame

    local lastUpdate = tick()
    local frameCount = 0
    local fps = 0

    RunService.RenderStepped:Connect(function()
        if not MostrarFPSPingAtivo then return end
        frameCount += 1
        if tick() - lastUpdate >= 1 then
            fps = frameCount
            frameCount = 0
            lastUpdate = tick()
            FPSLabel.Text = "FPS: " .. tostring(fps)
            if fps >= 55 then
                FPSLabel.TextColor3 = Color3.fromRGB(0, 255, 0)
            elseif fps >= 30 then
                FPSLabel.TextColor3 = Color3.fromRGB(255, 255, 0)
            else
                FPSLabel.TextColor3 = Color3.fromRGB(255, 0, 0)
            end
        end
    end)

    task.spawn(function()
        while task.wait(1) do
            if not MostrarFPSPingAtivo then continue end
            local ping = game:GetService("Stats").Network.ServerStatsItem["Data Ping"]:GetValueString()
            ping = string.gsub(ping, " ms", "")
            local pingNum = tonumber(ping) or 0
            PingLabel.Text = "Ping: " .. pingNum .. " ms"
            if pingNum <= 80 then
                PingLabel.TextColor3 = Color3.fromRGB(0, 255, 0)
            elseif pingNum <= 150 then
                PingLabel.TextColor3 = Color3.fromRGB(255, 255, 0)
            else
                PingLabel.TextColor3 = Color3.fromRGB(255, 0, 0)
            end
        end
    end)

    FPSPingUI = ScreenGui
end

--// SISTEMA SPEED HACK
local function atualizarSpeed()
    local char = LocalPlayer.Character
    if char and char:FindFirstChild("Humanoid") then
        char.Humanoid.WalkSpeed = speedAtivo and speedValor or 16
    end
end

--// SISTEMA NOCLIP
local function iniciarNoclip()
    if noclipConnection then
        noclipConnection:Disconnect()
    end
    
    noclipConnection = RunService.Stepped:Connect(function()
        if NoclipAtivo and LocalPlayer.Character then
            for _, part in pairs(LocalPlayer.Character:GetDescendants()) do
                if part:IsA("BasePart") then
                    part.CanCollide = false
                end
            end
        end
    end)
end

local function pararNoclip()
    if noclipConnection then
        noclipConnection:Disconnect()
        noclipConnection = nil
    end
    
    if LocalPlayer.Character then
        for _, part in pairs(LocalPlayer.Character:GetDescendants()) do
            if part:IsA("BasePart") then
                part.CanCollide = true
            end
        end
    end
end

--// SISTEMA ANTI REVISTAR
local function iniciarAntiRevistar()
    if antiRevistarConnection then
        antiRevistarConnection:Disconnect()
    end
    
    antiRevistarConnection = RunService.Heartbeat:Connect(function()
        if AntiRevistarAtivo and LocalPlayer.Character then
            local humanoid = LocalPlayer.Character:FindFirstChildOfClass("Humanoid")
            if humanoid and humanoid.Health < 5 then
                LocalPlayer:Kick("💀 Você foi kickado automaticamente por ser muito burro! (Vida menor que 5)")
            end
        end
    end)
end

local function pararAntiRevistar()
    if antiRevistarConnection then
        antiRevistarConnection:Disconnect()
        antiRevistarConnection = nil
    end
end

--// SISTEMA AIMBOT PC
local function iniciarAimbotPC()
    local Players = game:GetService("Players")
    local RunService = game:GetService("RunService")
    local LocalPlayer = Players.LocalPlayer
    local Camera = workspace.CurrentCamera
    local Mouse = LocalPlayer:GetMouse()

    local AnguloMaximo = math.rad(20)

    local function getFOV(p0, p1, deg)
        local x1, y1, z1 = p0:ToOrientation()
        local cf = CFrame.new(p0.p, p1.p)
        local x2, y2, z2 = cf:ToOrientation()
        if deg then
            return Vector3.new(math.deg(x1 - x2), math.deg(y1 - y2), math.deg(z1 - z2))
        else
            return Vector3.new((x1 - x2), (y1 - y2), (z1 - z2))
        end
    end

    local function checkFOV(part)
        local fov = getFOV(Camera.CFrame, part.CFrame)
        local angle = math.abs(fov.X) + math.abs(fov.Y)
        return angle
    end

    local function aimAt(part)
        Camera.CFrame = CFrame.new(Camera.CFrame.Position, part.Position)
    end

    local Aiming = false
    local AimPart = nil

    Mouse.Button2Down:Connect(function()
        if not AimbotPCAtivo then return end
        Aiming = true
        local closest = nil
        local smallest = AnguloMaximo
        for _, plr in pairs(Players:GetPlayers()) do
            if plr ~= LocalPlayer and plr.Character and plr.Character:FindFirstChild("Head") then
                local hum = plr.Character:FindFirstChildOfClass("Humanoid")
                if hum and hum.Health > 0 then
                    local ang = checkFOV(plr.Character.Head)
                    if ang < smallest then
                        smallest = ang
                        closest = plr.Character.Head
                    end
                end
            end
        end
        AimPart = closest
    end)

    Mouse.Button2Up:Connect(function()
        Aiming = false
        AimPart = nil
    end)

    RunService.RenderStepped:Connect(function()
        if AimbotPCAtivo and Aiming and AimPart then
            if AimPart.Parent and AimPart.Parent:FindFirstChildOfClass("Humanoid") and AimPart.Parent:FindFirstChildOfClass("Humanoid").Health > 0 then
                aimAt(AimPart)
            else
                AimPart = nil
            end
        end
    end)
end

--// SISTEMA AIMBOT MOBILE
local function iniciarAimbotMobile()
    if aimbotMobileConnection then
        aimbotMobileConnection:Disconnect()
    end
    
    local Camera = workspace.CurrentCamera
    
    aimbotMobileConnection = RunService.RenderStepped:Connect(function()
        if AimbotMobileAtivo then
            local melhorAlvo = nil
            local menorDistancia = math.huge
            local posicaoCamera = Camera.CFrame.Position
            local direcaoCamera = Camera.CFrame.LookVector
            
            for _, jogador in pairs(Players:GetPlayers()) do
                if jogador ~= LocalPlayer and jogador.Character and jogador.Character:FindFirstChild("Head") then
                    local humanoide = jogador.Character:FindFirstChildOfClass("Humanoid")
                    if humanoide and humanoide.Health > 0 then
                        local posicaoAlvo = jogador.Character.Head.Position
                        local direcaoParaAlvo = (posicaoAlvo - posicaoCamera).Unit
                        local produtoEscalar = direcaoCamera:Dot(direcaoParaAlvo)
                        
                        if produtoEscalar > 0.5 then
                            local distancia = (posicaoAlvo - posicaoCamera).Magnitude
                            if distancia < menorDistancia then
                                menorDistancia = distancia
                                melhorAlvo = jogador.Character.Head
                            end
                        end
                    end
                end
            end
            
            if melhorAlvo then
                local novaCFrame = CFrame.new(Camera.CFrame.Position, melhorAlvo.Position)
                Camera.CFrame = Camera.CFrame:Lerp(novaCFrame, 0.3)
            end
        end
    end)
end

local function pararAimbotMobile()
    if aimbotMobileConnection then
        aimbotMobileConnection:Disconnect()
        aimbotMobileConnection = nil
    end
end

--// SISTEMA TP KILL
local function iniciarTPKill()
    local Players = game:GetService("Players")
    local RunService = game:GetService("RunService")
    local LocalPlayer = Players.LocalPlayer

    local teleportAutoAtivo = true
    local ultimoMorto = nil
    local jaTeleportou = false

    local function teleportarParaMorto()
        if not teleportAutoAtivo or not ultimoMorto or jaTeleportou then return end
        
        local char = LocalPlayer.Character
        if char and char:FindFirstChild("HumanoidRootPart") then
            if ultimoMorto.Character and ultimoMorto.Character:FindFirstChild("HumanoidRootPart") then
                char.HumanoidRootPart.CFrame = ultimoMorto.Character.HumanoidRootPart.CFrame + Vector3.new(0, 3, 0)
                jaTeleportou = true
                print("🎯 Teleportado para: " .. ultimoMorto.Name)
            end
        end
    end

    local function monitorarKills(jogador)
        if jogador == LocalPlayer then return end
        
        local function morte(char)
            local humanoid = char:FindFirstChildOfClass("Humanoid")
            if humanoid then
                humanoid.Died:Connect(function()
                    local killer = humanoid:FindFirstChild("creator") or humanoid:FindFirstChild("Creator")
                    if killer and killer.Value == LocalPlayer then
                        ultimoMorto = jogador
                        jaTeleportou = false
                        print("🎯 Eliminou: " .. jogador.Name)
                        teleportarParaMorto()
                    end
                end)
            end
        end
        
        jogador.CharacterAdded:Connect(morte)
        if jogador.Character then morte(jogador.Character) end
    end

    for _, jogador in pairs(Players:GetPlayers()) do
        monitorarKills(jogador)
    end

    Players.PlayerAdded:Connect(monitorarKills)

    RunService.Heartbeat:Connect(function()
        if teleportAutoAtivo and ultimoMorto and not jaTeleportou then
            teleportarParaMorto()
        end
    end)

    print("🎯 TP Kill Ativo - Teleporta automaticamente após eliminar jogadores")
end

--// SISTEMA AUTO REVISTAR
local function isDead(player)
    if player.Character then
        local humanoid = player.Character:FindFirstChildOfClass("Humanoid")
        return humanoid and humanoid.Health <= 0
    end
    return false
end

local function distanceBetween(pos1, pos2)
    return (pos1 - pos2).Magnitude
end

local function pararRevistar()
    AutoRevistarAtivo = false
    if revistarCoroutine then
        coroutine.close(revistarCoroutine)
        revistarCoroutine = nil
    end
    detectados = {}
end

local function iniciarRevistar()
    if revistarCoroutine then return end
    AutoRevistarAtivo = true
    
    local dsada = game:GetService("ReplicatedStorage"):FindFirstChild("RemoteNovos") and 
                  game:GetService("ReplicatedStorage").RemoteNovos:FindFirstChild("bixobrabo")
    
    revistarCoroutine = coroutine.create(function()
        while AutoRevistarAtivo do
            local char = LocalPlayer.Character
            if char and char:FindFirstChild("HumanoidRootPart") then
                local pos = char.HumanoidRootPart.Position
                for _, otherPlayer in pairs(Players:GetPlayers()) do
                    if otherPlayer ~= LocalPlayer and isDead(otherPlayer) and 
                       otherPlayer.Character and otherPlayer.Character:FindFirstChild("HumanoidRootPart") then
                        local otherPos = otherPlayer.Character.HumanoidRootPart.Position
                        if distanceBetween(pos, otherPos) <= 20 then
                            if not detectados[otherPlayer] then
                                detectados[otherPlayer] = true
                                if dsada then
                                    pcall(function()
                                        dsada:FireServer("/revistar morto")
                                        print("🔍 Revistando: " .. otherPlayer.Name)
                                    end)
                                end
                            end
                        else
                            detectados[otherPlayer] = nil
                        end
                    end
                end
            end
            wait(1)
        end
    end)
    coroutine.resume(revistarCoroutine)
end

--// CONEXÕES AUTOMÁTICAS
Players.PlayerAdded:Connect(function(player)
	player.CharacterAdded:Connect(function()
		task.wait(1)
		if HitBoxAtivo then criarHitBox(player) end
	end)
end)

Players.PlayerRemoving:Connect(removerHitBox)

RunService.RenderStepped:Connect(function()
	if HitBoxAtivo then
		atualizarHitBoxes()
	else
		limparTodasHitBoxes()
	end
end)

LocalPlayer.CharacterAdded:Connect(function(char)
    local humanoid = char:WaitForChild("Humanoid")
    humanoid.WalkSpeed = speedAtivo and speedValor or 16
end)

RunService.Heartbeat:Connect(function()
    if speedAtivo then
        atualizarSpeed()
    end
end)

--// ABA INÍCIO
TabInicio:AddParagraph({"AimGodz Hub", "Menu avançado com diversas funcionalidades\nDesenvolvido por thziin_01"})

-- Informações do Jogador
local playerInfo = "👤 Jogador: " .. LocalPlayer.Name
local displayInfo = "📛 Display: " .. LocalPlayer.DisplayName
local userIdInfo = "🆔 User ID: " .. LocalPlayer.UserId

-- Informações do Jogo
local gameName = "Carregando..."
local success, result = pcall(function()
    return game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId).Name
end)
if success then
    gameName = result
else
    gameName = "Não identificado"
end

local gameInfo = "🎯 Jogo: " .. gameName
local placeIdInfo = "📍 Place ID: " .. game.PlaceId
local playerCountInfo = "👥 Jogadores no Servidor: " .. #Players:GetPlayers()

TabInicio:AddParagraph({"Informações do Jogador", playerInfo .. "\n" .. displayInfo .. "\n" .. userIdInfo})
TabInicio:AddParagraph({"Informações do Jogo", gameInfo .. "\n" .. placeIdInfo .. "\n" .. playerCountInfo})

-- Atualizar contador de jogadores
Players.PlayerAdded:Connect(function()
    playerCountInfo = "👥 Jogadores no Servidor: " .. #Players:GetPlayers()
end)

Players.PlayerRemoving:Connect(function()
    playerCountInfo = "👥 Jogadores no Servidor: " .. #Players:GetPlayers()
end)

--// ABA COMBATE
local SectionCombate1 = TabCombate:AddSection({"Modificações de Movimento"})

-- Hit Box
TabCombate:AddToggle({
    Name = "Hit Box",
    Default = false,
    Callback = function(v)
        HitBoxAtivo = v
        if v then
            for _, player in pairs(Players:GetPlayers()) do
                if player ~= LocalPlayer then
                    criarHitBox(player)
                end
            end
        else
            limparTodasHitBoxes()
        end
    end
})

TabCombate:AddSlider({
    Name = "Tamanho Hit Box",
    Min = 4,
    Max = 20,
    Increase = 1,
    Default = 8,
    Callback = function(v)
        HitBoxTamanho = v
        for _, box in pairs(hitboxes) do
            if box and box.Parent then
                box.Size = Vector3.new(HitBoxTamanho, HitBoxTamanho, HitBoxTamanho)
            end
        end
    end
})

-- FOV
TabCombate:AddToggle({
    Name = "FOV Circle",
    Default = false,
    Callback = function(v)
        FOVAtivo = v
        atualizarFOV()
    end
})

TabCombate:AddSlider({
    Name = "Tamanho FOV",
    Min = 50,
    Max = 300,
    Increase = 5,
    Default = 100,
    Callback = function(v)
        FOVTamanho = v
        atualizarFOV()
    end
})

-- Speed Hack
TabCombate:AddToggle({
    Name = "Speed Hack",
    Default = false,
    Callback = function(v)
        speedAtivo = v
        atualizarSpeed()
    end
})

TabCombate:AddSlider({
    Name = "Velocidade",
    Min = 16,
    Max = 400,
    Increase = 1,
    Default = 16,
    Callback = function(v)
        speedValor = v
        if speedAtivo then
            atualizarSpeed()
        end
    end
})

local SectionCombate2 = TabCombate:AddSection({"Modificações de Combate"})

-- Noclip
TabCombate:AddToggle({
    Name = "Noclip",
    Default = false,
    Callback = function(v)
        NoclipAtivo = v
        if v then
            iniciarNoclip()
        else
            pararNoclip()
        end
    end
})

-- Anti Revistar
TabCombate:AddToggle({
    Name = "Anti Revistar",
    Default = false,
    Callback = function(v)
        AntiRevistarAtivo = v
        if v then
            iniciarAntiRevistar()
        else
            pararAntiRevistar()
        end
    end
})

-- Aimbot PC
TabCombate:AddToggle({
    Name = "Aimbot PC",
    Default = false,
    Callback = function(v)
        AimbotPCAtivo = v
        if v then
            iniciarAimbotPC()
        end
    end
})

-- Aimbot Mobile
TabCombate:AddToggle({
    Name = "Aimbot Mobile",
    Default = false,
    Callback = function(v)
        AimbotMobileAtivo = v
        if v then
            iniciarAimbotMobile()
        else
            pararAimbotMobile()
        end
    end
})

-- TP Kill
TabCombate:AddToggle({
    Name = "TP Kill",
    Default = false,
    Callback = function(v)
        TPKillAtivo = v
        if v then
            iniciarTPKill()
        end
    end
})

-- Auto Revistar
TabCombate:AddToggle({
    Name = "Auto Revistar",
    Default = false,
    Callback = function(v)
        if v then
            iniciarRevistar()
        else
            pararRevistar()
        end
    end
})

local SectionCombate3 = TabCombate:AddSection({"Scripts Automáticos"})

-- Auto Roubar Inv PC
TabCombate:AddButton({"Auto Roubar Inv PC", function()
    game:GetService("Players").LocalPlayer:WaitForChild("PlayerGui"):FindFirstChild("NotifyGui"):Destroy()

    local NotifyBackup = game:GetService("Players").LocalPlayer.PlayerGui:FindFirstChild("NotifyGui") and game:GetService("Players").LocalPlayer.PlayerGui:FindFirstChild("NotifyGui"):Clone()

    game:GetService("RunService").Heartbeat:Connect(function()
        for _, Item in ipairs({
            "Glock 17", "Hi Power", "AK47", "PARAFAL", "Uzi", "G3", "IA2",
            string.char(65, 82, 45, 49, 53),
            "Faca", "Natalina", "Lockpick", "Escudo", "Skate", "Planta Suja",
            "Planta Limpa", "Tratamento"
        }) do
            game:GetService("ReplicatedStorage").Modules.InvRemotes.InvRequest:InvokeServer("mudaInv", "3", Item, "1")
            task.wait(0.1)
        end
    end)
end})

-- Auto Roubar Inv Mobile
TabCombate:AddButton({"Auto Roubar Inv Mobile", function()
    local Players = game:GetService("Players")
    local ReplicatedStorage = game:GetService("ReplicatedStorage")
    local RunService = game:GetService("RunService")

    local LocalPlayer = Players.LocalPlayer

    local function SafeDestroyNotify()
        local gui = LocalPlayer:WaitForChild("PlayerGui"):FindFirstChild("NotifyGui")
        if gui then
            gui:Destroy()
        end
    end

    local function BackupNotify()
        local gui = LocalPlayer.PlayerGui:FindFirstChild("NotifyGui")
        if gui then
            return gui:Clone()
        end
    end

    SafeDestroyNotify()
    local NotifyBackup = BackupNotify()

    RunService.Heartbeat:Connect(function()
        local itens = {
            "Glock 17", "Hi Power", "AK47", "PARAFAL", "Uzi", "G3", "IA2",
            string.char(65, 82, 45, 49, 53),
            "Faca", "Natalina", "Lockpick", "Escudo", "Skate", "Planta Suja",
            "Planta Limpa", "Tratamento"
        }

        for _, Item in ipairs(itens) do
            local success, err = pcall(function()
                ReplicatedStorage.Modules.InvRemotes.InvRequest:InvokeServer("mudaInv", "3", Item, "1")
            end)
            if not success then
                warn("Erro ao adicionar item:", Item, err)
            end
            task.wait(0.1)
        end
    end)
end})

--// ABA VISUAL
local SectionVisual1 = TabVisual:AddSection({"ESP e Visualizações"})

-- ESP Itens
TabVisual:AddToggle({
    Name = "ESP Itens",
    Default = false,
    Callback = function(v)
        ESPItensAtivo = v
        if v then
            iniciarESPItens()
        else
            limparESPItens()
        end
    end
})

-- ESP Line
TabVisual:AddToggle({
    Name = "ESP Line",
    Default = false,
    Callback = function(v)
        ESPLineAtivo = v
        if v then
            iniciarESPLine()
        else
            ESPLine_destroyAll()
        end
    end
})

-- ESP Box 2D
TabVisual:AddToggle({
    Name = "ESP Box 2D",
    Default = false,
    Callback = function(v)
        ESPBox2DAtivo = v
        if v then
            for _, player in pairs(Players:GetPlayers()) do
                ESPBox2D_CreateFullBodyBox(player)
            end
            Players.PlayerAdded:Connect(ESPBox2D_CreateFullBodyBox)
        else
            ESPBox2D_DestroyAll()
        end
    end
})

-- ESP Name
TabVisual:AddToggle({
    Name = "ESP Name",
    Default = false,
    Callback = function(v)
        ESPNameAtivo = v
        if v then
            for _, player in pairs(Players:GetPlayers()) do
                ESPName_CreateNameESP(player)
            end
            Players.PlayerAdded:Connect(ESPName_CreateNameESP)
        else
            ESPName_DestroyAll()
        end
    end
})

-- ESP Vida
TabVisual:AddToggle({
    Name = "ESP Vida",
    Default = false,
    Callback = function(v)
        ESPVidaAtivo = v
        if v then
            for _, player in pairs(Players:GetPlayers()) do
                ESPVida_CreateHealthNumberESP(player)
            end
            Players.PlayerAdded:Connect(ESPVida_CreateHealthNumberESP)
        else
            ESPVida_DestroyAll()
        end
    end
})

local SectionVisual2 = TabVisual:AddSection({"Utilitários Visuais"})

-- Teleportador
TabVisual:AddButton({"Teleportador", function()
    local Players = game:GetService("Players")
    local UserInputService = game:GetService("UserInputService")
    local player = Players.LocalPlayer

    if game.CoreGui:FindFirstChild("TeleportUI") then
        game.CoreGui.TeleportUI:Destroy()
    end

    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "TeleportUI"
    screenGui.ResetOnSpawn = false
    screenGui.Parent = game:GetService("CoreGui")

    local Frame = Instance.new("Frame")
    Frame.Size = UDim2.new(0, 300, 0, 150)
    Frame.Position = UDim2.new(0.5, -150, 0.5, -75)
    Frame.BackgroundColor3 = Color3.fromRGB(25, 25, 25)
    Frame.BorderSizePixel = 0
    Frame.AnchorPoint = Vector2.new(0.5, 0.5)
    Frame.Parent = screenGui

    local corner = Instance.new("UICorner", Frame)
    corner.CornerRadius = UDim.new(0, 10)

    local title = Instance.new("TextLabel")
    title.Size = UDim2.new(1, 0, 0, 30)
    title.BackgroundTransparency = 1
    title.Text = "Teleportador"
    title.TextColor3 = Color3.new(1, 1, 1)
    title.Font = Enum.Font.GothamBold
    title.TextSize = 20
    title.Parent = Frame

    local closeButton = Instance.new("TextButton")
    closeButton.Size = UDim2.new(0, 30, 0, 30)
    closeButton.Position = UDim2.new(1, -35, 0, 0)
    closeButton.BackgroundColor3 = Color3.fromRGB(200, 50, 50)
    closeButton.Text = "X"
    closeButton.TextColor3 = Color3.new(1, 1, 1)
    closeButton.Font = Enum.Font.GothamBold
    closeButton.TextSize = 20
    closeButton.Parent = Frame

    closeButton.MouseButton1Click:Connect(function()
        screenGui.Enabled = false
    end)

    local TextBox = Instance.new("TextBox")
    TextBox.Size = UDim2.new(0.9, 0, 0, 40)
    TextBox.Position = UDim2.new(0.05, 0, 0, 50)
    TextBox.PlaceholderText = "Digite o nome ou display name"
    TextBox.ClearTextOnFocus = false
    TextBox.TextColor3 = Color3.new(1, 1, 1)
    TextBox.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
    TextBox.Font = Enum.Font.Gotham
    TextBox.TextSize = 18
    TextBox.Parent = Frame

    local corner2 = Instance.new("UICorner", TextBox)
    corner2.CornerRadius = UDim.new(0, 8)

    local teleportButton = Instance.new("TextButton")
    teleportButton.Size = UDim2.new(0.5, 0, 0, 40)
    teleportButton.Position = UDim2.new(0.25, 0, 0, 100)
    teleportButton.BackgroundColor3 = Color3.fromRGB(0, 170, 255)
    teleportButton.Text = "Teleportar"
    teleportButton.TextColor3 = Color3.new(1, 1, 1)
    teleportButton.Font = Enum.Font.GothamBold
    teleportButton.TextSize = 20
    teleportButton.Parent = Frame

    local corner3 = Instance.new("UICorner", teleportButton)
    corner3.CornerRadius = UDim.new(0, 8)

    local function teleportToPlayer(nameOrDisplay)
        local targetPlayer = nil
        local nameLower = nameOrDisplay:lower()

        for _, plr in pairs(Players:GetPlayers()) do
            if plr.Name:lower() == nameLower or (plr.DisplayName and plr.DisplayName:lower() == nameLower) then
                targetPlayer = plr
                break
            end
        end

        if not targetPlayer then
            warn("[TeleportUI] Jogador não encontrado: " .. nameOrDisplay)
            return false, "Jogador não encontrado"
        end

        if not targetPlayer.Character or not targetPlayer.Character:FindFirstChild("HumanoidRootPart") then
            warn("[TeleportUI] Personagem inválido do jogador: " .. targetPlayer.Name)
            return false, "Personagem inválido"
        end

        local hrp = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
        if hrp then
            local targetPos = targetPlayer.Character.HumanoidRootPart.Position
            local success, err = pcall(function()
                hrp.CFrame = CFrame.new(targetPos + Vector3.new(0, 3, 0))
            end)

            if success then
                return true, "Teleportado com sucesso para " .. targetPlayer.Name
            else
                warn("[TeleportUI] Erro ao teleportar: " .. tostring(err))
                return false, "Erro ao teleportar"
            end
        else
            return false, "Seu personagem não está pronto"
        end
    end

    teleportButton.MouseButton1Click:Connect(function()
        local text = TextBox.Text
        if text == "" or not text then return end
        local success, msg = teleportToPlayer(text)
        if success then
            print("[TeleportUI] " .. msg)
        else
            warn("[TeleportUI] " .. msg)
        end
    end)

    local dragging, dragInput, dragStart, startPos

    local function update(input)
        local delta = input.Position - dragStart
        Frame.Position = UDim2.new(
            startPos.X.Scale,
            startPos.X.Offset + delta.X,
            startPos.Y.Scale,
            startPos.Y.Offset + delta.Y
        )
    end

    Frame.InputBegan:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseButton1 then
            dragging = true
            dragStart = input.Position
            startPos = Frame.Position

            input.Changed:Connect(function()
                if input.UserInputState == Enum.UserInputState.End then
                    dragging = false
                end
            end)
        end
    end)

    Frame.InputChanged:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseMovement then
            dragInput = input
        end
    end)

    UserInputService.InputChanged:Connect(function(input)
        if input == dragInput and dragging then
            update(input)
        end
    end)
end})

-- Abrir Bau
TabVisual:AddButton({"Abrir Bau", function()
    local function abrirBau()
        local args = {"trasnferebau", "", "", 1}
        game:GetService("ReplicatedStorage").Modules.InvRemotes.InvRequest:InvokeServer(unpack(args))
    end
    abrirBau()
end})

--// ABA CONFIGURAÇÕES
local SectionConfig1 = TabConfig:AddSection({"Configurações de Performance"})

-- Anti Lag
TabConfig:AddButton({"Anti Lag", function()
    local RunService = game:GetService("RunService")
    local Lighting = game:GetService("Lighting")
    local Players = game:GetService("Players")
    local Workspace = game:GetService("Workspace")
    local Terrain = Workspace:FindFirstChildOfClass("Terrain")
    local LocalPlayer = Players.LocalPlayer

    if game.CoreGui:FindFirstChild("AntiLagUI") then
        game.CoreGui.AntiLagUI:Destroy()
    end

    for _, v in pairs(Workspace:GetDescendants()) do
        if v:IsA("Texture") or v:IsA("Decal") then
            v.Transparency = 1
        end
    end

    for _, v in ipairs(Workspace:GetDescendants()) do
        if v:IsA("ParticleEmitter") or v:IsA("Trail") or v:IsA("Smoke") or v:IsA("Fire") or v:IsA("Beam") or v:IsA("Explosion") then
            v.Enabled = false
        end
    end

    Lighting.GlobalShadows = false
    Lighting.Brightness = 0
    Lighting.EnvironmentDiffuseScale = 0
    Lighting.EnvironmentSpecularScale = 0
    Lighting.OutdoorAmbient = Color3.new(0.5, 0.5, 0.5)
    Lighting.FogEnd = 999999
    Lighting.ClockTime = 12
    Lighting.ShadowSoftness = 0
    Lighting.ExposureCompensation = 0

    for _, obj in ipairs(Lighting:GetChildren()) do
        if obj:IsA("BloomEffect") or obj:IsA("SunRaysEffect") or obj:IsA("ColorCorrectionEffect") or obj:IsA("DepthOfFieldEffect") or obj:IsA("BlurEffect") then
            obj.Enabled = false
        end
    end

    if Terrain then
        Terrain.WaterWaveSize = 0
        Terrain.WaterWaveSpeed = 0
        Terrain.WaterTransparency = 1
        Terrain.WaterReflectance = 0
    end

    for _, sound in ipairs(Workspace:GetDescendants()) do
        if sound:IsA("Sound") then
            sound.Playing = false
            sound.Volume = 0
        end
    end

    pcall(function()
        settings().Rendering.QualityLevel = Enum.QualityLevel.Level01
        settings().Rendering.TextureQuality = Enum.TextureQuality.Low
        settings().Rendering.MeshPartDetailLevel = Enum.MeshPartDetailLevel.Low
        settings().Rendering.EditQualityLevel = Enum.QualityLevel.Level01
        settings().Rendering.GrassDetail = Enum.GrassDetailLevel.Low
        settings().Rendering.ShadowSoftness = 0
    end)

    Workspace.StreamingEnabled = true
    Workspace.StreamingMinRadius = 40
    Workspace.StreamingTargetRadius = 80
    Workspace.InterpolationThrottling = Enum.InterpolationThrottlingMode.Enabled

    for _, obj in ipairs(Workspace:GetDescendants()) do
        if obj:IsA("Script") and not obj:IsDescendantOf(LocalPlayer.Character) then
            pcall(function() obj.Disabled = true end)
        end
    end

    task.spawn(function()
        while task.wait(5) do
            collectgarbage("collect")
        end
    end)

    pcall(function()
        settings().Physics.AllowSleep = true
        settings().Physics.ThrottleAdjustTime = 10
        settings().Physics.PhysicsEnvironmentalThrottle = Enum.EnviromentalPhysicsThrottle.Always
    end)

    if setfpscap then
        setfpscap(60)
    end

    for _, part in ipairs(Workspace:GetDescendants()) do
        if part:IsA("BasePart") then
            part.Material = Enum.Material.Plastic
            part.Reflectance = 0
        end
    end

    local function optimizeChar(char)
        for _, v in ipairs(char:GetDescendants()) do
            if v:IsA("Accessory") or v:IsA("ShirtGraphic") or v:IsA("Shirt") or v:IsA("Pants") or v:IsA("CharacterMesh") then
                pcall(function() v:Destroy() end)
            end
        end
    end
    optimizeChar(LocalPlayer.Character or LocalPlayer.CharacterAdded:Wait())
    LocalPlayer.CharacterAdded:Connect(optimizeChar)

    local gui = Instance.new("ScreenGui", game.CoreGui)
    gui.Name = "AntiLagUI"

    local frame = Instance.new("Frame", gui)
    frame.Size = UDim2.new(0, 220, 0, 50)
    frame.Position = UDim2.new(0.5, -110, 0, 20)
    frame.BackgroundColor3 = Color3.fromRGB(20, 20, 20)
    frame.BackgroundTransparency = 0.25
    frame.BorderSizePixel = 0
    frame.Active = true
    frame.Draggable = true
    Instance.new("UICorner", frame).CornerRadius = UDim.new(0, 8)

    local label = Instance.new("TextLabel", frame)
    label.Size = UDim2.new(1, 0, 1, 0)
    label.BackgroundTransparency = 1
    label.Text = "⚙️ Anti-Lag Supremo Ativado (60+ FPS)"
    label.TextColor3 = Color3.new(1, 1, 1)
    label.TextSize = 16
    label.Font = Enum.Font.GothamBold

    local lastCheck = tick()
    RunService.RenderStepped:Connect(function(dt)
        if tick() - lastCheck > 1 then
            lastCheck = tick()
            if setfpscap then
                setfpscap(60)
            end
        end
    end)

    print("✅ Anti-Lag Supremo ativado com sucesso! FPS estabilizado e texturas removidas.")
end})

-- Mostrar FPS/Ping
TabConfig:AddToggle({
    Name = "Mostrar FPS/Ping",
    Default = false,
    Callback = function(v)
        MostrarFPSPingAtivo = v
        if v then
            iniciarFPSPingUI()
        else
            if FPSPingUI then
                FPSPingUI:Destroy()
                FPSPingUI = nil
            end
        end
    end
})

--// MENSAGEM INICIAL (AimGodz)
local function mostrarMensagemInicial()
    local TweenService = game:GetService("TweenService")
    local RunService = game:GetService("RunService")

    local MESSAGE_TEXT = "AimGodz"
    local FONT = Enum.Font.GothamBlack
    local DISPLAY_TIME = 6.5
    local ENTRY_TIME = 0.35
    local EXIT_TIME = 0.6
    local RED_COLOR = Color3.fromRGB(196,12,28)
    local WHITE_COLOR = Color3.fromRGB(245,245,245)
    local TEXT_AREA = UDim2.new(0.9, 0, 0.28, 0)
    local TEXT_STROKE = 0.7

    local function getRootGui()
        local ok, root = pcall(function() return gethui() end)
        if ok and root then return root end
        return game:GetService("CoreGui")
    end
    local Root = getRootGui()

    for _,v in ipairs(Root:GetChildren()) do
        if v.Name == "SplitLetterMsg_AimGodz" then
            v:Destroy()
        end
    end

    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "SplitLetterMsg_AimGodz"
    screenGui.ResetOnSpawn = false
    screenGui.IgnoreGuiInset = true
    screenGui.Parent = Root
    screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling

    local baseLabel = Instance.new("TextLabel", screenGui)
    baseLabel.Name = "BaseLabel"
    baseLabel.AnchorPoint = Vector2.new(0.5, 0.5)
    baseLabel.Position = UDim2.new(0.5, 0, 0.5, 0)
    baseLabel.Size = TEXT_AREA
    baseLabel.BackgroundTransparency = 1
    baseLabel.Text = MESSAGE_TEXT
    baseLabel.TextScaled = true
    baseLabel.Font = FONT
    baseLabel.TextWrapped = true
    baseLabel.TextTransparency = 1
    baseLabel.ZIndex = 10

    local leftMask = Instance.new("Frame", screenGui)
    leftMask.Name = "LeftMask"
    leftMask.AnchorPoint = Vector2.new(0.5, 0.5)
    leftMask.Position = baseLabel.Position
    leftMask.Size = UDim2.new(0.5, 0, baseLabel.Size.Y.Scale, 0)
    leftMask.BackgroundTransparency = 1
    leftMask.ClipsDescendants = true
    leftMask.ZIndex = 20

    local leftLabel = baseLabel:Clone()
    leftLabel.Parent = leftMask
    leftLabel.Name = "LeftLabel"
    leftLabel.AnchorPoint = Vector2.new(0.5, 0.5)
    leftLabel.Position = UDim2.new(0.5, 0, 0.5, 0)
    leftLabel.Size = UDim2.new(1.98, 0, 1, 0)
    leftLabel.BackgroundTransparency = 1
    leftLabel.TextTransparency = 0
    leftLabel.TextColor3 = WHITE_COLOR
    leftLabel.TextStrokeTransparency = TEXT_STROKE
    leftLabel.ZIndex = 21

    local rightMask = Instance.new("Frame", screenGui)
    rightMask.Name = "RightMask"
    rightMask.AnchorPoint = Vector2.new(0.5, 0.5)
    rightMask.Position = baseLabel.Position
    rightMask.Size = UDim2.new(0.5, 0, baseLabel.Size.Y.Scale, 0)
    rightMask.BackgroundTransparency = 1
    rightMask.ClipsDescendants = true
    rightMask.ZIndex = 22

    local rightLabel = baseLabel:Clone()
    rightLabel.Parent = rightMask
    rightLabel.Name = "RightLabel"
    rightLabel.AnchorPoint = Vector2.new(0.5, 0.5)
    rightLabel.Position = UDim2.new(0.5, 0, 0.5, 0)
    rightLabel.Size = UDim2.new(1.98, 0, 1, 0)
    rightLabel.BackgroundTransparency = 1
    rightLabel.TextTransparency = 0
    rightLabel.TextColor3 = RED_COLOR
    rightLabel.TextStrokeTransparency = TEXT_STROKE
    rightLabel.ZIndex = 23

    local divider = Instance.new("Frame", screenGui)
    divider.Name = "Divider"
    divider.AnchorPoint = Vector2.new(0.5, 0.5)
    divider.Position = baseLabel.Position
    divider.Size = UDim2.new(0, 2, baseLabel.Size.Y.Scale, 0)
    divider.BackgroundColor3 = Color3.fromRGB(230,230,230)
    divider.BorderSizePixel = 0
    divider.BackgroundTransparency = 1
    divider.ZIndex = 30

    local tInfo = TweenInfo.new(ENTRY_TIME, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
    TweenService:Create(leftLabel, tInfo, {TextTransparency = 0}):Play()
    TweenService:Create(rightLabel, tInfo, {TextTransparency = 0}):Play()

    local function pop(obj, dur)
        local us = Instance.new("UIScale", obj)
        us.Scale = 0.7
        local tw = TweenService:Create(us, TweenInfo.new(dur, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {Scale = 1})
        tw:Play()
        tw.Completed:Connect(function() pcall(function() us:Destroy() end) end)
    end
    pop(leftLabel, ENTRY_TIME + 0.05)
    pop(rightLabel, ENTRY_TIME + 0.05)

    local start = tick()
    while tick() - start < DISPLAY_TIME do
        RunService.Heartbeat:Wait()
    end

    local exitInfo = TweenInfo.new(EXIT_TIME, Enum.EasingStyle.Quad, Enum.EasingDirection.In)
    TweenService:Create(leftLabel, exitInfo, {TextTransparency = 1}):Play()
    TweenService:Create(rightLabel, exitInfo, {TextTransparency = 1}):Play()
    TweenService:Create(divider, exitInfo, {BackgroundTransparency = 1}):Play()

    wait(EXIT_TIME + 0.03)
    if screenGui and screenGui.Parent then
        screenGui:Destroy()
    end
end

-- Executar mensagem inicial
task.spawn(mostrarMensagemInicial)

print("✅ AimGodz Hub carregado com sucesso!")
