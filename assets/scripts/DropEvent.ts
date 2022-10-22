import { Event, Vec2, Node } from 'cc';

export class DropEvent extends Event {
    constructor(name: string, bubbles?: boolean, position: Vec2, item: Node) {
        super(name, bubbles);
        this.position = position;
        this.item = item;
    }
    public position: Vec2 = new Vec2(); 
    public item: Node = null;
}