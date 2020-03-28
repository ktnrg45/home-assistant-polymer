import {
  html,
  LitElement,
  customElement,
  property,
  css,
  CSSResult,
  TemplateResult,
} from "lit-element";
import "@material/mwc-button";
import "@polymer/paper-menu-button/paper-menu-button";
import "@polymer/paper-icon-button/paper-icon-button";
import "@polymer/paper-listbox/paper-listbox";

import { showEditCardDialog } from "../editor/card-editor/show-edit-card-dialog";
import { confDeleteCard } from "../editor/delete-card";
import { HomeAssistant } from "../../../types";
import { LovelaceCardConfig } from "../../../data/lovelace";
import { Lovelace } from "../types";
import { swapCard } from "../editor/config-util";
import { showMoveCardViewDialog } from "../editor/card-editor/show-move-card-view-dialog";

@customElement("hui-card-options")
export class HuiCardOptions extends LitElement {
  public cardConfig?: LovelaceCardConfig;

  @property() public hass?: HomeAssistant;

  @property() public lovelace?: Lovelace;

  @property() public path?: [number, number];

  protected render(): TemplateResult {
    return html`
      <slot></slot>
      <ha-card>
        <div class="options" @dragover="${this._dragOverMove}">
          <div class="primary-actions">
            <mwc-button @click="${this._editCard}"
              >${this.hass!.localize(
                "ui.panel.lovelace.editor.edit_card.edit"
              )}</mwc-button
            >
          </div>
          <div class="secondary-actions">
            <paper-icon-button
              title="Move card"
              class="move-cursor"
              icon="mdi:cursor-move"
              draggable="true"
              @dragstart="${this._dragStartMove}"
              @mousedown="${this._moveSelect}"
            ></paper-icon-button>
            <paper-icon-button
              title="Move card down"
              class="move-arrow"
              icon="hass:arrow-down"
              @click="${this._cardDown}"
              ?disabled="${this.lovelace!.config.views[this.path![0]].cards!
                .length ===
                this.path![1] + 1}"
            ></paper-icon-button>
            <paper-icon-button
              title="Move card up"
              class="move-arrow"
              icon="hass:arrow-up"
              @click="${this._cardUp}"
              ?disabled="${this.path![1] === 0}"
            ></paper-icon-button>
            <paper-menu-button
              horizontal-align="right"
              vertical-align="bottom"
              vertical-offset="40"
              close-on-activate
            >
              <paper-icon-button
                icon="hass:dots-vertical"
                slot="dropdown-trigger"
                aria-label=${this.hass!.localize(
                  "ui.panel.lovelace.editor.edit_card.options"
                )}
              ></paper-icon-button>
              <paper-listbox slot="dropdown-content">
                <paper-item @tap="${this._moveCard}">
                  ${this.hass!.localize(
                    "ui.panel.lovelace.editor.edit_card.move"
                  )}</paper-item
                >
                <paper-item @tap=${this._duplicateCard}
                  >${this.hass!.localize(
                    "ui.panel.lovelace.editor.edit_card.duplicate"
                  )}</paper-item
                >
                <paper-item .class="delete-item" @tap="${this._deleteCard}">
                  ${this.hass!.localize(
                    "ui.panel.lovelace.editor.edit_card.delete"
                  )}</paper-item
                >
              </paper-listbox>
            </paper-menu-button>
          </div>
        </div>
      </ha-card>
    `;
  }

  static get styles(): CSSResult {
    return css`
      :host(:hover) {
        outline: 2px solid var(--primary-color);
      }

      ha-card {
        border-top-right-radius: 0;
        border-top-left-radius: 0;
        box-shadow: rgba(0, 0, 0, 0.14) 0px 2px 2px 0px,
          rgba(0, 0, 0, 0.12) 0px 1px 5px -4px,
          rgba(0, 0, 0, 0.2) 0px 3px 1px -2px;
      }

      div.options {
        border-top: 1px solid #e8e8e8;
        padding: 5px 8px;
        display: flex;
        margin-top: -1px;
      }

      div.options .primary-actions {
        flex: 1;
        margin: auto;
      }

      div.options .secondary-actions {
        flex: 4;
        text-align: right;
      }

      paper-icon-button {
        color: var(--primary-text-color);
      }

      paper-icon-button.move-arrow[disabled] {
        color: var(--disabled-text-color);
      }

      paper-icon-button.move-cursor {
        cursor: move;
      }

      paper-menu-button {
        color: var(--secondary-text-color);
        padding: 0;
      }

      paper-item.header {
        color: var(--primary-text-color);
        text-transform: uppercase;
        font-weight: 500;
        font-size: 14px;
      }

      paper-item {
        cursor: pointer;
      }

      paper-item.delete-item {
        color: var(--google-red-500);
      }
    `;
  }

  private _duplicateCard(): void {
    const path = this.path!;
    const cardConfig = this.lovelace!.config.views[path[0]].cards![path[1]];
    showEditCardDialog(this, {
      lovelaceConfig: this.lovelace!.config,
      cardConfig,
      saveConfig: this.lovelace!.saveConfig,
      path: [path[0]],
    });
  }

  private _editCard(): void {
    showEditCardDialog(this, {
      lovelaceConfig: this.lovelace!.config,
      saveConfig: this.lovelace!.saveConfig,
      path: this.path!,
    });
  }

  private _cardUp(): void {
    const lovelace = this.lovelace!;
    const path = this.path!;
    lovelace.saveConfig(
      swapCard(lovelace.config, path, [path[0], path[1] - 1])
    );
  }

  private _cardDown(): void {
    const lovelace = this.lovelace!;
    const path = this.path!;
    lovelace.saveConfig(
      swapCard(lovelace.config, path, [path[0], path[1] + 1])
    );
  }

  private _moveCard(): void {
    showMoveCardViewDialog(this, {
      path: this.path!,
      lovelace: this.lovelace!,
    });
  }

  private _deleteCard(): void {
    confDeleteCard(this, this.hass!, this.lovelace!, this.path!);
  }

  private _moveSelect(_event): void {
    if (!cardMoveHandle.moveActive) {
      cardMoveHandle.sourceCard = this;
      document.addEventListener("click", moveHandle, false);
    } else if (cardMoveHandle.sourceCard != this) {
      this.style.outline = "2px solid var(--google-red-500)";
      cardMoveHandle.movePositionCard(this.lovelace!, this.path!);
    }
  }

  private _dragStartMove(event): void {
    event.dataTransfer.effectAllowed = "move";
    cardMoveHandle.sourceCard = this;
    this.style.opacity = "0.5";
    this.addEventListener("dragend", this._dragEndMove, false);
  }

  private _dragEndMove(_event): void {
    cardMoveHandle.clear();
    this.removeEventListener("dragend", this._dragEndMove, false);
  }

  private _dragOverMove(event): void {
    event.preventDefault();
    this.addEventListener("dragleave", this._dragLeaveMove, false);
    this.addEventListener("drop", this._dropMove, false);
    if (cardMoveHandle.sourceCard != this) {
      this.style.outline = "2px solid var(--google-red-500)";
    }
  }

  private _dragLeaveMove(_event): void {
    if (cardMoveHandle.sourceCard != this) {
      this.removeEventListener("dragleave", this._dragLeaveMove, false);
      this.removeEventListener("drop", this._dropMove, false);
      this.style.outline = "";
      this.style.opacity = "";
    }
  }

  private _dropMove(_event): void {
    if (cardMoveHandle.sourceCard != this) {
      cardMoveHandle.movePositionCard(this.lovelace!, this.path!);
    }
  }
}

class cardMoveHandler {
  public sourceCard: HuiCardOptions | undefined;
  public moveActive: boolean;

  constructor() {
    this.sourceCard = undefined;
    this.moveActive = false;
  }

  public clear(): void {
    if (this.sourceCard!) {
      this.sourceCard!.style.opacity = "";
      this.sourceCard!.style.outline = "";
    }
    this.sourceCard = undefined;
    this.moveActive = false;
    document.removeEventListener("click", moveHandle, false);
  }

  public movePositionCard(lovelace, targetPath): void {
    const sourceIndex = this.sourceCard!.path![1];
    var newCards = [...lovelace.config.views[targetPath[0]].cards!];
    const sourceCard = newCards[sourceIndex];

    newCards.splice(sourceIndex, 1);
    newCards.splice(targetPath[1], 0, sourceCard);
    const newView = {
      ...lovelace.config.views[targetPath[0]],
      cards: newCards,
    };

    const config = {
      ...lovelace.config,
      views: lovelace.config.views.map((origView, index) =>
        index === targetPath[0] ? newView : origView
      ),
    };
    lovelace.saveConfig(config);
    this.clear();
  }
}

var cardMoveHandle = new cardMoveHandler();

function moveHandle(_event): void {
  if (cardMoveHandle.moveActive && cardMoveHandle.sourceCard) {
    cardMoveHandle.clear();
  } else if (cardMoveHandle.sourceCard) {
    cardMoveHandle.moveActive = true;
    cardMoveHandle.sourceCard!.style.opacity = "0.5";
    cardMoveHandle.sourceCard!.style.outline = "2px solid var(--primary-color)";
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-card-options": HuiCardOptions;
  }
}
