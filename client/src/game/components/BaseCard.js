import { LitElement, html, css} from 'lit-element'
import StaticRequestor from '../../common/StaticRequestor'

class BaseCard extends LitElement {
    static get properties() {
        return {
            role: { type: String }
        }
    }

    static get styles() {
        return css`
            :host {
                position: relative;
                max-height: 100%;
            }
            img {
                display: block;
                margin: auto;
                width: 100%;
                object-fit: contain;
                cursor: pointer;
                z-index: 1;
            }
        `
    }

    constructor() {
        super()
        this.role = null
    }

    handleClick(event) {
        this.dispatchEvent(new Event('clicked'))
    }

    render() {
        return html`
            <img @click=${ this.handleClick } src=${ `${ StaticRequestor.basePath }/WerewolfImages/Werewolf/${ this.role || 'back' }.png` }></img>
        `
    }
}

customElements.define('base-card', BaseCard)