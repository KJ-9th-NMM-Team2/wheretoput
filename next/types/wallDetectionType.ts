export interface WallDetectionParam {
    morphType?: number;
    canny1?: number;
    canny2?: number;
    houghTh?: number;
    minLen?: number;
    maxGap?: number;
}

export interface ParallelLine {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
}

export interface Point {
    x: number;
    y: number;
}

export interface WallTransformation {
    start: {
        x: number,
        y: number,
    },
    end: {
        x: number,
        y: number,
    }
}

export interface WallData {
    dimensions: {
        width: number,
        height: number,
        depth: number,
    },
    position: number;
    rotation: number;
}