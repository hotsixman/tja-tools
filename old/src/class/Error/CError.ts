import { TJAError } from "./TJAError.js";

export class CError extends TJAError{}

export namespace CError{
    export const codes = {
        "TJA_COURSE_NOT_ENDED": "#END가 선언되지 않음.",
        "UNKNOWN_DIFFICULTY": "알 수 없는 난이도."
    } 
}