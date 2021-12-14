import { google } from "googleapis";
import { BaseResponder } from "./BaseResponder";
let clientSecret;

try {
    clientSecret = require("./../config/client_secret.json");
} catch (e) {
    clientSecret = JSON.parse(process.env.GOOGLE_CLIENT_SECRET as string);
}

const scopes = ['https://www.googleapis.com/auth/drive']

export const drive = google.drive({
    version: 'v3',
    auth: new google.auth.JWT(clientSecret.client_email, undefined, clientSecret.private_key, scopes)
});

export abstract class DriveResponder extends BaseResponder {
    rootFolderId: string;

    constructor(game: string, rootFolderId: string) {
        super(game);
        this.rootFolderId = rootFolderId;
    }

    abstract loadEntries(parentFolderId: string, folderId: string): Promise<void>;
}