import fs from 'fs';

class Whitelist {
    constructor() {}

    addUser(user) {
        fs.readFile('config/default.json', 'utf-8', (error, data) => {
            if (error) {
                console.log(error);
                return false;
            } else {
                const config = JSON.parse(data);
                
                let newWhitelist = config.white_list;

                newWhitelist.push(user);

                config.white_list = newWhitelist;

                fs.writeFile('./config/default.json', JSON.stringify(config), (error) => {
                    if (error) {
                        console.log(error);
                        return false;
                    }
                })
            }
        })
        return true;
    }
}

export const whitelist = new Whitelist();