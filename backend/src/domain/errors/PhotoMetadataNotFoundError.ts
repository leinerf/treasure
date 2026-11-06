import { EntryNotFoundError} from "./EntryNotFound.js";

export class PhotoMetadataNotFoundError extends EntryNotFoundError {
    constructor(message: string) {
        super(message);
        this.name = "PhotoMetadataNotFoundError";
    }
}

export default PhotoMetadataNotFoundError;