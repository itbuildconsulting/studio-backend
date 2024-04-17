import express from "express";
import BannerController from "./controllers/BannerController";
//import UploadConfig from "./configs/upload";
import upload from './configs/upload';
import multer from 'multer';

const routes = express.Router();
//const upload = multer(uploadConfig);

routes.get('/users', (request, response) => {
    console.log('Listagem de usuários');
    response.send('Hello World');
});

routes.post('/cms/home/v1/banner/:lng', upload, BannerController.store);
//routes.get('/banners/:lng', BannerController.index);
routes.get('/cms/home/v1/banners/:lng', BannerController.listBanners);
routes.get('/cms/home/v1/banners_home/:lng', BannerController.listBannersHome);
routes.post('/cms/home/v1/banners_order/:lng', BannerController.updateBannerOrder);
routes.get('/cms/home/v1/banner_by_id/:lng/:id', BannerController.findBannerById);
routes.post('/cms/home/v1/banner_edit/:lng', upload,  BannerController.updateBanner);
routes.delete('/cms/home/v1/banner/:lng/:id', BannerController.delete);

export default routes;