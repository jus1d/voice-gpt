import fs from 'fs';

class Whitelist {
    constructor() {}

    get() {
        const file = fs.readFileSync('./config/whitelist.json', 'utf-8');
        const data = JSON.parse(file);
        return data.whitelist.map(user => user.userId);
    }

    addUser(user) {
        const file = fs.readFileSync('./config/whitelist.json', 'utf-8');

        const data = JSON.parse(file);
        let newWitelist = data.whitelist;

        newWitelist.push(user);

        data.whitelist = newWitelist;

        fs.writeFile('config/whitelist.json', JSON.stringify(data), (error) => {
            if (error) {
                console.log(error);
                return false;
            }
        });

        return true;
    }
}

export const whitelist = new Whitelist();