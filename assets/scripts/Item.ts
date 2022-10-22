
import { _decorator, Component, Node, Vec2, EventTouch, Prefab, instantiate } from 'cc';
const { ccclass, property } = _decorator;
import { DropEvent } from './DropEvent';

/**
 * Predefined variables
 * Name = Item
 * DateTime = Fri Oct 21 2022 23:06:12 GMT+0300 (Eastern European Summer Time)
 * Author = a0z0ra
 * FileBasename = Item.ts
 * FileBasenameNoExtension = Item
 * URL = db://assets/scripts/Item.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */
 
@ccclass('Item')
export class Item extends Component {

    position: Vec2 = new Vec2();
    row: number = null;
    column: number = null;
    sign: number = null;
    level: number = 0;
    currentNode: Node = null;
    mouseDown: boolean = false;

    @property({ type: Prefab })
    private levelPrefabs = [];

    start() {
        this.node.on(Node.EventType.TOUCH_START, (event) => {
            this.mouseDown = true;
        }, this);

        this.node.on(Node.EventType.TOUCH_MOVE, (event) => {
            if (!this.mouseDown) return;

            const delta = event.getUIDelta();
            const x = this.node.getPosition().x + delta.x;
            const y = this.node.getPosition().y + delta.y;
    
            this.node.setPosition(x, y, 0);
        });

        this.node.on(Node.EventType.TOUCH_END, (event) => {
            this.mouseDown = false;
            this.node.dispatchEvent(new DropEvent('dropped', true, event.getUILocation(), this.node));
        });

        this.levelUp();
    }

    setBoardPosition(row: number, column: number): void {
        this.row = row;
        this.column = column;
    }

    setBoardSign(sign: number): void {
        this.sign = sign;
    }

    levelUp(): void {
        const newIdx = this.level;
        this.level++;

        if (this.level > this.levelPrefabs.length) return;

        if (this.currentNode) {
            this.currentNode.destroy();
        }

        this.currentNode = instantiate(this.levelPrefabs[newIdx]);
        this.node.addChild(this.currentNode);                
    }
}
