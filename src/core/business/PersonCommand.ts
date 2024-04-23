import executeQueryWithoutTransaction from '../db/database';
import { sqlQueries } from '../sqls/sqls';

const PersonCommand = {
    
    async showAllPerson(): Promise<any>{
        return await executeQueryWithoutTransaction(sqlQueries['showAllPerson'],true);
    },
    
    async createDataBase(){
        await executeQueryWithoutTransaction(sqlQueries['ct_Person'],false);
    }
}

export default PersonCommand;