const http = require('http');
const express = require('express')
const path = require('path')
const GameDatabase = require('./src/GameDatabase')
const PlayerDatabase = require('./src/PlayerDatabase')
const SessionDatabase = require('./src/SessionDatabase')
const SessionRoutes = require('./routes/SessionRoutes')
const PlayerRoutes = require('./routes/PlayerRoutes')

const app = express()
app.use(express.json())
app.use(express.static(path.join(__dirname, './public')))

// allow CORS for development on different ports
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE')
    next()
})

let _errorResponse = (res, msg) => res.writeHead(400, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache'
}).end(JSON.stringify({ err: msg }, null, 2))

let _jsonResponse = (res, obj) => res.writeHead(200, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache'
}).end(JSON.stringify(obj, null, 2))

let context = {
    sendError: _errorResponse,
    sendJSON: _jsonResponse,
    app: app
}

// player routes
let PM = new PlayerDatabase()
PlayerRoutes(context, PM)

// game host routes
let GM = new GameDatabase()

// session routes
let SM = new SessionDatabase()
SessionRoutes(context, SM, PM, GM)

app.get('/', (req, res) => {
    res.redirect('/join.html')
})

///////////////////////////////////////////////////////// game
app.get('/games/:gameId/status/:playerId', (req, res) => {
    let game = GM.get(req.params.gameId)
    if (!game) return _errorResponse(res, 'bad game id')
    let playerId = req.params.playerId
    let player = game.getPlayer(playerId)
    if (!player) return _errorResponse(res, 'unregistered playerId in find')

    res.writeHead(200, {
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'Content-Type': 'text/event-stream'
    });
    res.flushHeaders()
    
    game.addListener(playerId, game => {
        res.write(`data: ${JSON.stringify(game.json)}\n\n`)
    })

    req.on('close', () => {
        console.log('closed from client', playerId)
        game.removeListener(playerId)
    })
})

app.post('/games/:gameId/players/:playerId/prepare', function(req, res) {
    let game = GM.get(req.params.gameId)
    if (!game) return _errorResponse(res, 'bad game id')
    let player = PM.get(req.params.playerId)
    if (!player) return _errorResponse(res, 'bad player id')
    if (!game.prepare(player.id)) return _errorResponse(res, 'unregistered playerId in prepare')
    _jsonResponse(res, {})
})

app.get('/games/:gameId/voteNow', function(req, res) {
    let game = GM.get(req.params.gameId)
    if (!game) return _errorResponse(res, 'bad game id')
    game.updateStatus('endGame')
    _jsonResponse(res, {})
})

app.get('/games/:gameId', function(req, res) {
    let game = GM.get(req.params.gameId)
    if (!game) return _errorResponse(res, 'bad game id')
    _jsonResponse(res, game.json)
})

app.post('/games/:gameId/start/:deck', function(req, res) {
    let game = GM.get(req.params.gameId)
    if (!game) return _errorResponse(res, 'bad game id')
    let deck = JSON.parse(req.params.deck)
    if (!deck) return _errorResponse(res, 'bad deck')
    try {
        game.start(deck)
    }
    catch (e){
        return _errorResponse(res, e)
    }
    _jsonResponse(res, { status: game.status })
})

app.post('/games/:gameId/players/:playerId/vote/:votedId', function(req, res) {
    let game = GM.get(req.params.gameId)
    if (!game) return _errorResponse(res, 'bad game id')
    let playerId = req.params.playerId
    let votedId = req.params.votedId
    if (!game.voteAction(playerId, votedId)) return _errorResponse(res, 'unregistered playerId or votedId in find')
    _jsonResponse(res, game.json)
})

app.post('/games/:gameId/players/:playerId/endNightAction', (req, res) => {
    let game = GM.get(req.params.gameId)
    let playerId = req.params.playerId
    if (!game) return _errorResponse(res, 'bad game id')
    if (!game.nightAction(playerId)) return _errorResponse(res, 'unregistered playerId in find')
    _jsonResponse(res, {})
})

///////////////////////////////////////////////////////// night actions
app.get('/games/:gameId/players/:playerId/werewolf', function(req, res) {
    let game = GM.get(req.params.gameId)
    if (!game) return _errorResponse(res, 'bad game id')
    let player = game.getPlayer(req.params.playerId)
    if (!player) return _errorResponse(res, 'bad player')
    if (game.getPlayer(player.id).startRole != 'werewolf') return _errorResponse(res, 'not a werewolf')
    let werewolfPlayerIds = []
    game.players.forEach(player => {
        if (player.startRole == 'werewolf') werewolfPlayerIds.push(player.id)
    })
    _jsonResponse(res, werewolfPlayerIds)
})

app.get('/games/:gameId/players/:playerId/minion', function(req, res) {
    let game = GM.get(req.params.gameId)
    if (!game) return _errorResponse(res, 'bad game id')
    let player = game.getPlayer(req.params.playerId)
    if (!player) return _errorResponse(res, 'bad player')
    if (game.getPlayer(player.id).startRole != 'minion') return _errorResponse(res, 'not a minion')
    let werewolfPlayerIds = []
    game.players.forEach(player => {
        if (player.startRole == 'werewolf') werewolfPlayerIds.push(player.id)
    })
    _jsonResponse(res, werewolfPlayerIds)
})

app.get('/games/:gameId/players/:playerId/mason', function(req, res) {
    let game = GM.get(req.params.gameId)
    if (!game) return _errorResponse(res, 'bad game id')
    let player = game.getPlayer(req.params.playerId)
    if (!player) return _errorResponse(res, 'bad player')
    if (game.getPlayer(player.id).startRole != 'mason') return _errorResponse(res, 'not a mason')
    let masonPlayerIds = []
    game.players.forEach(player => {
        if (player.startRole == 'mason') masonPlayerIds.push(player.id)
    })
    _jsonResponse(res, masonPlayerIds)
})

app.post('/games/:gameId/players/:playerId/robber/:swapIds', function(req, res) {
    let game = GM.get(req.params.gameId)
    if (!game) return _errorResponse(res, 'bad game id')
    let player = game.getPlayer(req.params.playerId)
    if (!player) return _errorResponse(res, 'bad player')
    if (game.getPlayer(player.id).startRole != 'robber') return _errorResponse(res, 'not a robber')
    let swapIds = JSON.parse(req.params.swapIds)
    if (swapIds.length != 0 && swapIds.length != 2) return _errorResponse(res, 'illegal swap')
    game.robberNightAction(swapIds)
    _jsonResponse(res, {})
})

app.post('/games/:gameId/players/:playerId/troublemaker/:swapIds', function(req, res) {
    let game = GM.get(req.params.gameId)
    if (!game) return _errorResponse(res, 'bad game id')
    let player = game.getPlayer(req.params.playerId)
    if (!player) return _errorResponse(res, 'bad player')
    if (game.getPlayer(player.id).startRole != 'troublemaker') return _errorResponse(res, 'not a troublemaker')
    let swapIds = JSON.parse(req.params.swapIds)
    if (swapIds.length != 0 && swapIds.length != 2) return _errorResponse(res, 'illegal swap')
    game.troublemakerNightAction(swapIds)
    _jsonResponse(res, {})
})

app.post('/games/:gameId/players/:playerId/drunk/:swapIds', function(req, res) {
    let game = GM.get(req.params.gameId)
    if (!game) return _errorResponse(res, 'bad game id')
    let player = game.getPlayer(req.params.playerId)
    if (!player) return _errorResponse(res, 'bad player')
    if (game.getPlayer(player.id).startRole != 'drunk') return _errorResponse(res, 'not a drunk')
    let swapIds = JSON.parse(req.params.swapIds)
    if (swapIds.length != 0 && swapIds.length != 2) return _errorResponse(res, 'illegal swap')
    game.drunkNightAction(swapIds)
    _jsonResponse(res, {})
})

http.createServer(app).listen(9615);
