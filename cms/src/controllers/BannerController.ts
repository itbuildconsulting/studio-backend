//const Banner = require('../models/Banner');
import sharp from 'sharp';
import path from 'path';

import fs from 'fs';

import uploadFile from '../configs/storageGoogle';

import BannerPT from '../models/BannerPT';
import BannerEN from '../models/BannerEN';
import BannerES from '../models/BannerES';

export interface ImagesBanner {
    image: String, 
    alt: String,
    link: String,
    status: Boolean,
    size: String,
}

// Função para converter uma imagem para WebP com 75% de qualidade
function convertToWebP(inputPath: string, outputPath:string) {
    return new Promise((resolve, reject) => {
        sharp(inputPath)
            .webp({ quality: 50 })
            .toFile(outputPath, (err, info) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(info);
                }
            });
    });
}

async function processAndUploadImage(fileImage: any, image: any, finalName: any, lng: any) {
    try {
        // Caminho de saída para a imagem convertida
        const outputPath = fileImage.destination + "\\" + image.split('.')[0] + '.webp';

        // Aguarda a conversão para WebP ser concluída
        await convertToWebP(fileImage.path, outputPath);

        // Após a conversão estar completa, faz o upload do arquivo
        const fileUrl = uploadFile(outputPath, 'destinow/cms/hmo/' + lng + '/' + finalName);

        // Retorna a URL do arquivo após o upload
        return fileUrl;
    } catch (error) {
        console.error('Erro ao processar e fazer upload da imagem:', error);
        // Trate o erro conforme necessário
    }
}

// Chame a função onde necessário, passando os argumentos corretos
// Exemplo: const fileUrl = await processAndUploadImage(fileImage, image, finalName);


const BannerController = {

        async index(request: any, response: any){
            
            const  banners = await BannerPT.find().sort('order');

            return response.json(banners);
        },

        async listBanners(request: any, response: any){
           
            const BannerSelected = request.params.lng === 'pt' ? BannerPT : request.params.lng === 'en' ? BannerEN : request.params.lng === 'es' ? BannerES : null;
            const  banners = await BannerSelected.find().sort('order');

            const modifiedBanners = banners.map((banner: { images: string | any[]; _id: any; author: any; status: any; dateStart: any; dateEnd: any; lastChange: any; createdAt: any; updatedAt: any; })  => {
                // Supondo que você sempre queira a primeira imagem do array 'images'
                const firstImage = banner.images.length > 0 ? banner.images[0].image !== '' ? banner.images[0].image : banner.images[1].image !== '' ? banner.images[1].image: banner.images[2].image !== '' ? banner.images[2].image : null : null;
            
                return {
                    id: banner._id,
                    author: banner.author,
                    status: banner.status,
                    dateStart: banner.dateStart,
                    dateEnd: banner.dateEnd,
                    lastChange: banner.lastChange,
                    image: firstImage, // Aqui adicionamos a primeira imagem
                    createdAt: banner.createdAt,
                    updatedAt: banner.updatedAt
                    // Removemos 'lng' e o array 'images' completo
                };
            });

            if (!modifiedBanners) {
                return response.status(404).send('Banner não encontrado.');
            }

            return response.status(200).send({ 
                success: true, 
                message: 'Banners listados com sucesso', 
                data: modifiedBanners }
            );
            
           // return response.json(modifiedBanners);
        },


        async listBannersHome(request: any, response: any){
            const hoje = new Date();
            hoje.setUTCHours(0, 0, 0, 0); // Ajusta a hora para meia-noite em UTC
            const dataISO = hoje.toISOString(); // Converte para o formato ISO 8601

            const BannerSelected = request.params.lng === 'pt' ? BannerPT : request.params.lng === 'en' ? BannerEN : request.params.lng === 'es' ? BannerES : null;
            const  banners = await BannerSelected.find({
                status: true,
                dateStart: { $lte: hoje },
                dateEnd: { $gte: hoje }
            }).sort('order');

            const modifiedBanners = banners.map((banner: { images: string | any[]; _id: any; author: any; status: any; dateStart: any; dateEnd: any; lastChange: any; createdAt: any; updatedAt: any; })  => {
                // Supondo que você sempre queira a primeira imagem do array 'images'
                const firstImage = banner.images.length > 0 ? banner.images[0].image : null;
            
                return {
                    id: banner._id,
                    author: banner.author,
                    status: banner.status,
                    dateStart: banner.dateStart,
                    dateEnd: banner.dateEnd,
                    lastChange: banner.lastChange,
                    image: banner.images, // Aqui adicionamos a primeira imagem
                    createdAt: banner.createdAt,
                    updatedAt: banner.updatedAt
                    // Removemos 'lng' e o array 'images' completo
                };
            });

            if (!modifiedBanners) {
                return response.status(404).send('Banner não encontrado.');
            }

            return response.status(200).send({ 
                success: true, 
                message: 'Banners listados com sucesso', 
                data: modifiedBanners
                
            }
            );
            
           // return response.json(modifiedBanners);
        },

        async delete(request: any, response: any){
            const BannerSelected = request.params.lng === 'pt' ? BannerPT : request.params.lng === 'en' ? BannerEN : request.params.lng === 'es' ? BannerES : null;

            const { id } = request.params;
            //console.log(request)
            //console.log(id)

            try {
                const banner = await BannerSelected.findByIdAndDelete(id);

                if (!banner) {
                    return response.status(404).send(
                        { 
                            success: false, 
                            message: 'Banner não encontrado.', 
                        }
                    );
                }

                return response.status(200).send(
                    { 
                        success: true, 
                        message: 'Banner deletado com sucesso.',
                    }
                    );

            } catch (error) {

                return response.status(500).send(
                    { 
                        success: false, 
                        message: 'Erro ao deletar banner.', 
                    });
            }

            //return response.json(banners);
        },

        async updateBannerOrder(request: any, response: any) {

            const bannersToUpdate = request.body;
            const BannerSelected = request.params.lng === 'pt' ? BannerPT : request.params.lng === 'en' ? BannerEN : request.params.lng === 'es' ? BannerES : null;
            
            try {
                // Itera sobre o array de banners e atualiza cada um
                await Promise.all(bannersToUpdate.map(async (banner: any) => {
                    await BannerSelected.findByIdAndUpdate(banner.id, { order: banner.order });
                }));
        
                console.log('Todos os banners foram atualizados com sucesso.');
                return response.json(
                    { 
                        success: true, 
                        message: 'Ordem atualizada com sucesso', 
                    }
                    );

            } catch (error) {

                console.error('Erro ao atualizar banners:', error);                
                return response.status(500).json(
                    { 
                        success: false, 
                        error: 'Erro ao atualizar banners' }
                    );
            }
        },

        async findBannerById(request: any, response: any) {

            const BannerSelected = request.params.lng === 'pt' ? BannerPT : request.params.lng === 'en' ? BannerEN : request.params.lng === 'es' ? BannerES : null;
            const { id } = request.params;

            try {
                const banner = await BannerSelected.findById(id);

                if (!banner) {
                    return response.status(404).send(
                        { 
                            success: false, 
                            message: 'Banner não encontrado.', 
                        }
                    );
                }

                return response.status(200).send(
                    { 
                        success: true, 
                        message: 'Banner listado com sucesso.',
                        data: {banner}
                    }
                    );

            } catch (error) {

                return response.status(500).send(
                    { 
                        success: false, 
                        message: 'Erro ao listar banner.', 
                    });
            }

        },

        async store(request: any, response: any){
            //console.log(request)
            const BannerSelected = request.params.lng === 'pt' ? BannerPT : request.params.lng === 'en' ? BannerEN : request.params.lng === 'es' ? BannerES : null;
            sharp.cache(false);
            try {
                // Lógica do controller
                const filesImageArray = Object.values(request.files).flat();
                const filesArray = Object.values(request.body.images).flat();

                let arrayFinal: any = {
                    author: request.body.author,
                    order: request.body.order,
                    status: request.body.status,
                    title: request.body.title,
                    lng: request.body.lng,
                    dateStart: request.body.dateStart,
                    dateEnd: request.body.dateEnd,
                    lastChange: request.body.lastChange,
                    images: []
                }

                
                 await Promise.all(filesArray.map((file: any, index: any) => {

                    //console.log(typeof request.body.images[index].image)

                    if(typeof request.body.images[index].image === 'string'){

                        const tempObj = {
                            image: request.body.images[index].image,
                            alt: request.body.images[index].alt,
                            link: request.body.images[index].link,
                            status: request.body.images[index].status,
                            size: request.body.images[index].size,
                        };
    
                        arrayFinal.images.push(tempObj)
                        return arrayFinal;

                    }else{
                        
                        //console.log(filesImageArray)

                        Promise.all(filesImageArray.map(async (fileImage: any, indexImage: any) => {
                            
                            if(fileImage.fieldname === `images[${index}][image]`){

                                const { filename: image } = fileImage;

                                //const outputPath = fileImage.path.split('.')[0] + '.webp';

                                const finalName = image.split(' ').join('_').split('.')[0] + '.webp';


                                try {

                                    /*sharp(fileImage.path).webp({quality: 75}).toFile(outputPath, async (err, info) => {
                                        if (err) {
                                            console.error('Erro ao converter imagem:', err);
                                        } else {
                                            await console.log('Imagem convertida com sucesso:', info);
                                            //
                                        }
                                    });*/

           
                                    const fileUrl = processAndUploadImage(fileImage, image, finalName, request.params.lng);

                                    const tempObj = {
                                        image: 'https://storage.googleapis.com/cdn.hmo.c2rio.travel/destinow/cms/hmo/'+request.params.lng+'/' + finalName,
                                        alt: request.body.images[index].alt,
                                        link: request.body.images[index].link,
                                        status: request.body.images[index].status,
                                        size: request.body.images[index].size,
                                    };
                
                                    arrayFinal.images.push(tempObj)

                                    return arrayFinal;
                                    // ... restante do processamento ...
                                } catch (error) {
                                    console.error('Erro ao processar a imagem:', error);
                                    // Tratar o erro adequadamente
                                }

                            }
                        
                        }));

                        
                    }

                }));
                if(arrayFinal.images.length > 0){
                    const banner = await BannerSelected.create(arrayFinal)
        
                    request.io.emit('banners', banner);
    
    
                    
                    return response.json(
                        { 
                            success: true, 
                            message: 'Banner inserido com sucesso', 
                            data: { banner } }
                        );

                }else{
                    return response.status(500).json(
                        { 
                            success: false, 
                            error: 'Internal Server Error' }
                        );

                }
                
            } catch (error) {
                return response.status(500).json(
                    { 
                        success: false, 
                        error: 'Internal Server Error' }
                    );
            }

           
        },


        async updateBanner(request: any, response: any) {
            const BannerSelected = request.params.lng === 'pt' ? BannerPT : 
                                    request.params.lng === 'en' ? BannerEN : 
                                    request.params.lng === 'es' ? BannerES : null;
            sharp.cache(false);
            // console.log(request.body)
            try {
                // Assumindo que o ID do banner a ser atualizado é passado na requisição
                //const bannerId = request.params.id;

                //const filesArray = Object.values(request.files).flat();
                const filesImageArray = Object.values(request.files).flat();
                const filesArray = Object.values(request.body.images).flat();
        
                // Preparando os dados para atualizar
                let updateData: any = {
                    
                    _id: request.body.id,
                    author: request.body.author,
                    order: request.body.order,
                    status: request.body.status,
                    title: request.body.title,
                    lng: request.body.lng,
                    dateStart: request.body.dateStart,
                    dateEnd: request.body.dateEnd,
                    lastChange: request.body.lastChange,
                    images: [] // Assumindo que as imagens também serão atualizadas
                };
        
                // Adiciona a lógica para processar imagens aqui, semelhante à função `store`

                await Promise.all(filesArray.map((file: any, index: any) => {

                    //console.log(typeof request.body.images[index].image)

                    if(typeof request.body.images[index].image === 'string'){

                        const tempObj = {
                            image: request.body.images[index].image,
                            alt: request.body.images[index].alt,
                            link: request.body.images[index].link,
                            status: request.body.images[index].status,
                            size: request.body.images[index].size,
                        };
    
                        updateData.images.push(tempObj)
                        return updateData;

                    }else{
                        
                        //console.log(filesImageArray)

                        Promise.all(filesImageArray.map((fileImage: any, indexImage: any) => {
                            
                            if(fileImage.fieldname === `images[${index}][image]`){

                                const { filename: image } = fileImage;

                                try {
                                    sharp(fileImage.path);
                                    //const fileUrl = uploadFile(fileImage.destination+ "/" + image, 'cms/'+request.params.lng+'/'+image);
                                    const fileUrl = uploadFile(fileImage.destination+ "\\" + image, 'destinow/cms/hmo/'+request.params.lng+'/'+image);
                       
                                    const tempObj = {
                                        image: 'https://storage.googleapis.com/cdn.hmo.c2rio.travel/destinow/cms/hmo/'+request.params.lng+'/' + image,
                                        alt: request.body.images[index].alt,
                                        link: request.body.images[index].link,
                                        status: request.body.images[index].status,
                                        size: request.body.images[index].size,
                                    };
                
                                    updateData.images.push(tempObj)
                                    return updateData;
                                    // ... restante do processamento ...
                                } catch (error) {
                                    console.error('Erro ao processar a imagem:', error);
                                    // Tratar o erro adequadamente
                                }

                            }
                        
                        }));

                        
                    }

                }));


        
                // Atualiza o banner no banco de dados
                const updatedBanner = await BannerSelected.findByIdAndUpdate(request.body.id, updateData, { new: true });
        
                if (!updatedBanner) {
                    return response.status(404).json({ success: false, error: 'Banner não encontrado' });
                }
        
                request.io.emit('banners', updatedBanner);
                return response.json({ success: true, message: 'Banner atualizado com sucesso', data: { updatedBanner } });
            } catch (error) {
                console.error('Erro ao atualizar o banner:', error);
                return response.status(500).json({ success: false, error: 'Internal Server Error' });
            }
        }
}

export default BannerController;