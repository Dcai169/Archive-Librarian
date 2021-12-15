import { google } from "googleapis";
import * as clientSecret from "./../config/client_secret.json";
import { BaseResponder } from "./BaseResponder";

const scopes = ['https://www.googleapis.com/auth/drive']

export const drive = google.drive({
    version: 'v3',
    auth: new google.auth.JWT(clientSecret.client_email, undefined, clientSecret.private_key, scopes)
});

export abstract class DriveResponder extends BaseResponder {
    rootFolderId: string;
    quotaTimeoutms: number;

    constructor(game: string, rootFolderId: string) {
        super(game);
        this.rootFolderId = rootFolderId;
        this.quotaTimeoutms = 400;
    }

    abstract loadEntries(parentFolderId: string, parentFolderName: string): Promise<void>;
}