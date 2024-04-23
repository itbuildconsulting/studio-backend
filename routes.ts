import express from "express";
import SeedController from '../src/controllers/SeedController';
import PersonController from '../src/controllers/PersonController';

const routes = express.Router();
//const upload = multer(uploadConfig);

routes.get('/users', (request, response) => {
    console.log('Listagem de usuários');
    response.send('Hello World');
});

//routes.post('/cms/home/v1/banner/:lng', upload, BannerController.store);
//routes.get('/banners/:lng', BannerController.index);
//routes.get('/cms/home/v1/banners/:lng', BannerController.listBanners);
//routes.get('/cms/home/v1/banners_home/:lng', BannerController.listBannersHome);
routes.post('/cms/home/v1/person', PersonController.showAll);
routes.get('/cms/home/v1/person', PersonController.showAll);
//routes.post('/cms/home/v1/banner_edit/:lng', upload,  BannerController.updateBanner);
routes.delete('/cms/home/v1/person/:id', PersonController.showAll);

//seed
routes.post('/cms/home/v1/seed', SeedController.start);

export default routes;