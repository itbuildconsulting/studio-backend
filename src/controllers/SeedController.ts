import PersonCommand from '../core/business/PersonCommand';

const SeedController = {

        async start(request: any, response: any){
            
            const persons = await PersonCommand.createDataBase();

            return true;
        },
}

export default SeedController;