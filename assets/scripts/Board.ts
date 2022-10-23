
import { _decorator, Component, Node, Prefab, instantiate, UITransform, Vec3, Vec2 } from 'cc';
import { DropEvent } from './DropEvent';
import { Item } from './Item';
import { CellResultType } from './CellResultType';
import { DirectionEnum } from './DirectionEnum';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = Board
 * DateTime = Fri Oct 21 2022 20:22:47 GMT+0300 (Eastern European Summer Time)
 * Author = a0z0ra
 * FileBasename = Board.ts
 * FileBasenameNoExtension = Board
 * URL = db://assets/scripts/Board.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */
 
@ccclass('Board')
export class Board extends Component {

    board: Node[][] = [];
    gameBoard: number[][] = [];
    items: Item[] = [];

    @property()
    private row: number = 3;

    @property()
    private column: number = 2;

    @property()
    private gap: number = 1;

    @property({ type: Prefab })
    private cellPrefab = null;

    @property({ type: Prefab })
    private itemsPrefab = [];


    start() {
        this.createBoard();

        this.createRandomItems();

        this.node.on('dropped', this.onDrop, this);               
    }

    createBoard(): void {
        this.board = new Array(this.row);
        this.gameBoard = new Array(this.row);

        for (let row = 0; row < this.row; row++) {
            this.board[row] = new Array(this.column);
            this.gameBoard[row] = new Array(this.column).fill(0);

            for (let column = 0; column < this.column; column++) {
                const cell: Node = instantiate(this.cellPrefab);
                const uiTransform = cell.getComponent(UITransform);
                const width = uiTransform.width;
                const height = uiTransform.height;
                const offsetX = width/2 - (this.column * (width + this.gap) - this.gap) / 2;
                const offsetY = height/2 + (this.row * (height + this.gap) - this.gap) / 2;
                const x = offsetX + column * (width + this.gap);
                const y = offsetY - row * (height + this.gap);

                cell.setPosition(x, y, 0);
                cell.name = 'Cell-' + row + ',' + column;

                this.node.addChild(cell);

                this.board[row][column] = cell;
            }
        }
    }

    createRandomItems(): void {
        const activeNums: number[] = this.getRandomNumbers();
        
        for (let i = 0; i < activeNums.length; i++) {
            const itemIdx = i !== activeNums.length - 1 ? 0 : 1; 
            const idx = activeNums[i];
            const row = Math.floor(idx / this.column);
            const col = idx - row * this.column;

            this.gameBoard[row][col] = itemIdx + 1;

            const pos = this.board[row][col].getPosition();
            const item = instantiate(this.itemsPrefab[itemIdx]);

            item.setPosition(pos);

            const itemComponent = item.getComponent(Item);
            itemComponent.setBoardPosition(row, col);
            itemComponent.sign = itemIdx + 1;

            this.node.addChild(item);

            this.items.push(itemComponent);            
        }        
    }

    private getRandomNumbers(): number[] {
        const array = new Array(this.row * this.column).fill(0).map((e, i) => e = i);
        const result = [];
        
        for (let i = 0; i < array.length; i++) {
            const idx = Math.floor(Math.random() * array.length);    
            result.push(array.splice(idx, 1));
        }

        return result;
    }

    onDrop(event: DropEvent): void {
        const uit = this.node.parent.getComponent(UITransform);
        let pos = uit.convertToNodeSpaceAR(new Vec3(event.position.x, event.position.y, 0));
        
        const item = event.item.getComponent(Item);
        const cellResult = this.getSelectedCell(pos, item.sign);
        const oldPosition = this.board[item.row][item.column].getPosition();
        
        if (cellResult) {        
            const otherItem = this.items.filter((e: Item) => e.row === cellResult.row && e.column === cellResult.column)[0];
            
            // stay home
            if (otherItem == item) {                
                event.item.setPosition(oldPosition);
                return;
            }

            // similar item
            if (cellResult.similar) { 
                otherItem.node.destroy();
                
                item.levelUp();

                this.items = this.items.filter((e: Item) => e != otherItem);
            }

            // not empty cell and not similar item
            if (!cellResult.similar && !cellResult.empty) {
                const emptyCell = this.getFirstEmptyCell(otherItem.row, otherItem.column, item);
                const newCell = this.board[emptyCell.y][emptyCell.x];

                otherItem.node.setPosition(newCell.getPosition());

                this.gameBoard[emptyCell.y][emptyCell.x] = otherItem.sign;

                otherItem.setBoardPosition(emptyCell.y, emptyCell.x);            
            }

            const cell = this.board[cellResult.row][cellResult.column];

            item.node.setPosition(cell.getPosition());

            if (cellResult.empty || cellResult.similar) {
                this.gameBoard[item.row][item.column] = 0;
            }

            this.gameBoard[cellResult.row][cellResult.column] = item.sign;

            item.setBoardPosition(cellResult.row, cellResult.column);            
        } else {
            event.item.setPosition(oldPosition);
        }        
    }

    private getSelectedCell(pos: Vec3, sign: number): CellResultType | null {
        for (let row = 0; row < this.row; row++) {
            for (let column = 0; column < this.column; column++) {
                const cell = this.board[row][column];
                const cellPos = cell.getPosition();
                const cellUITransform = cell.getComponent(UITransform);
                const width = cellUITransform.width;
                const height = cellUITransform.height;

                if (pos.x >= cellPos.x - width / 2 &&
                    pos.x <= cellPos.x + width / 2 &&
                    pos.y >= cellPos.y - height / 2 &&
                    pos.y <= cellPos.y + height / 2) {                      

                    const isSimilar = this.gameBoard[row][column] === sign;
                    const isEmpty = this.gameBoard[row][column] === 0;

                    return {
                        row: row,
                        column: column,
                        similar: isSimilar,
                        empty: isEmpty
                    };
                }
            }
        }

        return null;
    }      

    private getFirstEmptyCell(startRow: number, startColumn: number, space: Item = null): Vec2 {
        if (space !== null) {
            this.gameBoard[space.row][space.column] = 0;
        }

        const neighbors: Vec2[] = [];
        const checked: Vec2[] = [];
        let isStarted = true;

        neighbors.push(new Vec2(startColumn, startRow));
                
        while (neighbors.length > 0) {
            const pos = neighbors.pop();

            if (!isStarted) {
                if (this.gameBoard[pos.y][pos.x] === 0) return new Vec2(pos.x, pos.y);
            } else {
                isStarted = false;
            }

            checked.push(pos);

            this.getNeighbors(pos, checked, neighbors);
        }

        return new Vec2(space.column, space.row);
    }

    private checkExistPos(array: Vec2[], pos: Vec2): boolean {
        for (let i = 0; i < array.length; i++) {
            if (array[i].y === pos.y && array[i].x === pos.x) {
                return true;
            }
        }

        return false;
    }

    private checkRangeBoard(row: number, column: number): boolean {
        return row >= 0 && row < this.row && column >= 0 && column < this.column;
    }

    private getNeighbors(pos: Vec2, checked: Vec2[], neighbors: Vec2[]): void {
        for (let i = 0; i < DirectionEnum.length; i++) {
            const row = pos.y + DirectionEnum[i].y;
            const column = pos.x + DirectionEnum[i].x;

            if (!this.checkRangeBoard(row, column)) continue;

            const newPos = new Vec2(column, row);

            if (this.checkExistPos(checked, newPos)) continue;

            if (this.checkExistPos(neighbors, newPos)) continue;

            if (this.gameBoard[newPos.y][newPos.x] !== 0) continue;

            neighbors.push(newPos);            
        }
    }
    
}

