import PersonCommand from '../core/business/PersonCommand';

const PersonController = {

        async showAll(request: any, response: any){
            
            const persons = await PersonCommand.showAllPerson();

            return response.json(persons);
        },
}

export default PersonController;