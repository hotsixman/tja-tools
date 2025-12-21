import * as math from 'mathjs';

export class Command {
    static parse(line: string, time: math.Fraction): Command {
        let spaceIndex = line.indexOf(' ');
        if(spaceIndex === -1) spaceIndex = line.length;

        const name = line.slice(1, spaceIndex) as Command.Name;
        const value = line.slice(spaceIndex + 1);

        return new Command({
            name,
            value,
            time
        })
    }

    name: Command.Name;
    value: string;
    time: math.Fraction

    private constructor(data: Command.ConstructorData) {
        this.name = data.name;
        this.value = data.value;
        this.time = data.time;
    }
}

export namespace Command {
    export type ConstructorData = {
        name: Name,
        value: string,
        time: math.Fraction,
    }
    export type Name = 'START' | 'END' | 'MEASURE' | 'BPMCHANGE' | 'DELAY' | 'SCROLL' | 'GOGOSTART' | 'GOGOEND' | 'BARLINEOFF' | 'BARLINEON' | 'BRANCHSTART' | 'N' | 'E' | 'M' | 'BRANCHEND' | 'SECTION' | 'LYRIC';
}