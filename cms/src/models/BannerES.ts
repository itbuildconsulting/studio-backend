const mongoogse = require('mongoose');

const BannerSchema = new mongoogse.Schema({
    author: String,
    order: Number,
    status: Boolean,
    title: String,
    lng: String,
    dateStart: Date,
    dateEnd: Date,
    lastChange: String,
    images: [
        {
            image: String, 
            alt: String,
            link: String,
            status: Boolean,
            size: String,            
        }
    ]
},{
    timestamps: true,
});

const BannerPT = mongoogse.model('bannerES', BannerSchema);

export default BannerPT