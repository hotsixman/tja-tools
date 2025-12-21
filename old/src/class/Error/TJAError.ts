export class TJAError extends Error{
    code: string;
    constructor(code: string, message?: string, options?: ErrorOptions){
        super(message, options);
        this.code = code;
    }
}