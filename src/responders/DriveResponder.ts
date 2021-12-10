import { BaseResponder } from "./BaseResponder";

export abstract class DriveResponder extends BaseResponder {
    rootFolderId: string;;

    constructor(game: string, rootFolderId: string) {
        super(game);
        this.rootFolderId = rootFolderId;
    }
}