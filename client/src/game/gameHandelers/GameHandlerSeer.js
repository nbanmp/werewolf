import GameHandler from './GameHandler'

class GameHandlerWerewolf extends GameHandler {
    constructor(game) {
        super(game)
        this._exposedIds = []
        this._lookedAtOne = false
        this._doneLooking = false
    }

    async _nightClick(id) {
        if (!this._doneLooking) {
            if ((id == 'left' || id == 'center' || id == 'right') && !this._exposedIds.includes(id)) {
                this._exposedIds.push(id)
                this._exposeRole(id)
                if (this._lookedAtOne) this._doneLooking = true
                this._lookedAtOne = true
            } else if (!this._lookedAtOne && this._player.id != id) {
                this._exposedIds.push(id)
                this._exposeRole(id)
                this._doneLooking = true
            }
        }
    }

    async _startNightP() {
    }

    async _endNightP() {
        this._exposedIds.forEach(id => this._hideRole(id))
        this._hideRole(this._player.id)
    }
}

export default GameHandlerWerewolf
