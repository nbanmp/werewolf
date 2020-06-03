import './PlayerGrid'
import './CenterCardGrid'
import './LowerBox'
import './GameView.css'

class GameView {
    constructor(game, interaction) {
        let main = document.createElement('div')
        main.className = 'main'
        
        this.playerGrid = document.createElement('player-grid')
        this.playerGrid.players = game.players
        this.playerGrid.addEventListener('clicked', event => interaction.onClick(event.detail))
        game.players.forEach(player => game.observeRole(player.id, role => this.playerGrid.exposePlayer(player.id, role)))
        game.players.forEach(player => game.observeDeath(player.id, dead => this.playerGrid.deadPlayer(player.id, dead)))
        game.players.forEach(player => game.observeVotes(player.id, votes => this.playerGrid.setVotes(player.id, votes)))
        
        this.centerCardGrid = document.createElement('center-card-grid')
        this.centerCardGrid.addEventListener('clicked',  event => interaction.onClick(event.detail))
        game.observeRole('left', role => this.centerCardGrid.exposeCard('left', role))
        game.observeRole('center', role => this.centerCardGrid.exposeCard('center', role))
        game.observeRole('right', role => this.centerCardGrid.exposeCard('right', role))

        this.lowerBox = document.createElement('lower-box')
        this.lowerBox.role = game.player.startRole

        main.appendChild(this.playerGrid)
        main.appendChild(this.centerCardGrid)
        main.appendChild(this.lowerBox)
        this.element = main

        game.observeTime((time) => this.lowerBox.time = time)
        game.observeRole('lower', role => this.lowerBox.exposeCard(role))
        game.observeDescription(role => this.lowerBox.changeDescription(role))
    }
    }

export default GameView
