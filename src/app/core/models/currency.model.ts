export class Currency {
    public code: string = '';
    public name: string = '';

    constructor(data: Partial<Currency> = {}) {
        this.code = data.code || '';
        this.name = data.name || '';
    }

    static fromJson(json: any): Currency {
        return new Currency(json);
    }
}
