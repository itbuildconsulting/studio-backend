# Details

Date : 2025-01-12 10:21:56

Directory e:\\Workspace\\ItBuild\\studio-backend

Total : 50 files,  5629 codes, 1343 comments, 546 blanks, all 7518 lines

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [package-lock.json](/package-lock.json) | JSON | 2,516 | 0 | 1 | 2,517 |
| [package.json](/package.json) | JSON | 43 | 0 | 1 | 44 |
| [src/app.ts](/src/app.ts) | TypeScript | 37 | 7 | 9 | 53 |
| [src/config/database.ts](/src/config/database.ts) | TypeScript | 9 | 0 | 3 | 12 |
| [src/controllers/appController.ts](/src/controllers/appController.ts) | TypeScript | 320 | 29 | 74 | 423 |
| [src/controllers/balanceController.ts](/src/controllers/balanceController.ts) | TypeScript | 60 | 2 | 7 | 69 |
| [src/controllers/checkoutController.ts](/src/controllers/checkoutController.ts) | TypeScript | 173 | 8 | 20 | 201 |
| [src/controllers/classController.ts](/src/controllers/classController.ts) | TypeScript | 231 | 30 | 37 | 298 |
| [src/controllers/dashboardController.ts](/src/controllers/dashboardController.ts) | TypeScript | 153 | 15 | 24 | 192 |
| [src/controllers/financialController.ts](/src/controllers/financialController.ts) | TypeScript | 85 | 8 | 16 | 109 |
| [src/controllers/itemsController.ts](/src/controllers/itemsController.ts) | TypeScript | 42 | 4 | 5 | 51 |
| [src/controllers/loginController.ts](/src/controllers/loginController.ts) | TypeScript | 65 | 6 | 24 | 95 |
| [src/controllers/personController.ts](/src/controllers/personController.ts) | TypeScript | 313 | 23 | 40 | 376 |
| [src/controllers/placeController.ts](/src/controllers/placeController.ts) | TypeScript | 113 | 8 | 11 | 132 |
| [src/controllers/productController.ts](/src/controllers/productController.ts) | TypeScript | 132 | 15 | 27 | 174 |
| [src/controllers/productTypeController.ts](/src/controllers/productTypeController.ts) | TypeScript | 154 | 14 | 19 | 187 |
| [src/controllers/seedController.ts](/src/controllers/seedController.ts) | TypeScript | 61 | 3 | 6 | 70 |
| [src/controllers/transactionController.ts](/src/controllers/transactionController.ts) | TypeScript | 63 | 8 | 9 | 80 |
| [src/core/email/emailService.ts](/src/core/email/emailService.ts) | TypeScript | 23 | 4 | 4 | 31 |
| [src/core/token/authenticateToken.ts](/src/core/token/authenticateToken.ts) | TypeScript | 15 | 6 | 8 | 29 |
| [src/core/token/generateAuthToken.ts](/src/core/token/generateAuthToken.ts) | TypeScript | 21 | 0 | 4 | 25 |
| [src/core/token/generateResetToken.ts](/src/core/token/generateResetToken.ts) | TypeScript | 19 | 0 | 4 | 23 |
| [src/index.ts](/src/index.ts) | TypeScript | 5 | 0 | 3 | 8 |
| [src/models/Balance.model.ts](/src/models/Balance.model.ts) | TypeScript | 36 | 6 | 8 | 50 |
| [src/models/Bike.model.ts](/src/models/Bike.model.ts) | TypeScript | 57 | 7 | 7 | 71 |
| [src/models/Class.model.ts](/src/models/Class.model.ts) | TypeScript | 83 | 7 | 9 | 99 |
| [src/models/ClassStudent.model.ts](/src/models/ClassStudent.model.ts) | TypeScript | 49 | 3 | 6 | 58 |
| [src/models/Item.model.ts](/src/models/Item.model.ts) | TypeScript | 81 | 5 | 7 | 93 |
| [src/models/Person.model.ts](/src/models/Person.model.ts) | TypeScript | 150 | 5 | 8 | 163 |
| [src/models/Place.model.ts](/src/models/Place.model.ts) | TypeScript | 44 | 5 | 7 | 56 |
| [src/models/Product.model.ts](/src/models/Product.model.ts) | TypeScript | 69 | 6 | 8 | 83 |
| [src/models/ProductType.model.ts](/src/models/ProductType.model.ts) | TypeScript | 49 | 6 | 8 | 63 |
| [src/models/Transaction.model.ts](/src/models/Transaction.model.ts) | TypeScript | 117 | 5 | 7 | 129 |
| [src/routes/appRoutes.ts](/src/routes/appRoutes.ts) | TypeScript | 14 | 115 | 15 | 144 |
| [src/routes/checkoutRoutes.ts](/src/routes/checkoutRoutes.ts) | TypeScript | 6 | 3 | 4 | 13 |
| [src/routes/classRoutes.ts](/src/routes/classRoutes.ts) | TypeScript | 10 | 66 | 9 | 85 |
| [src/routes/dashboardRoutes.ts](/src/routes/dashboardRoutes.ts) | TypeScript | 8 | 0 | 7 | 15 |
| [src/routes/financialRoutes.ts](/src/routes/financialRoutes.ts) | TypeScript | 7 | 20 | 7 | 34 |
| [src/routes/indexRoutes.ts](/src/routes/indexRoutes.ts) | TypeScript | 12 | 0 | 4 | 16 |
| [src/routes/loginRoutes.ts](/src/routes/loginRoutes.ts) | TypeScript | 5 | 29 | 6 | 40 |
| [src/routes/passwordRoutes.ts](/src/routes/passwordRoutes.ts) | TypeScript | 6 | 57 | 6 | 69 |
| [src/routes/personRoutes.ts](/src/routes/personRoutes.ts) | TypeScript | 24 | 223 | 13 | 260 |
| [src/routes/placeRoutes.ts](/src/routes/placeRoutes.ts) | TypeScript | 10 | 281 | 9 | 300 |
| [src/routes/productRoutes.ts](/src/routes/productRoutes.ts) | TypeScript | 18 | 148 | 10 | 176 |
| [src/routes/productTypeRoutes.ts](/src/routes/productTypeRoutes.ts) | TypeScript | 18 | 125 | 10 | 153 |
| [src/routes/seedRoutes.ts](/src/routes/seedRoutes.ts) | TypeScript | 7 | 30 | 6 | 43 |
| [src/swagger/swagger.ts](/src/swagger/swagger.ts) | TypeScript | 39 | 0 | 5 | 44 |
| [src/types.d.ts](/src/types.d.ts) | TypeScript | 9 | 1 | 2 | 12 |
| [tsconfig.json](/tsconfig.json) | JSON with Comments | 25 | 0 | 1 | 26 |
| [vercel.json](/vercel.json) | JSON | 23 | 0 | 1 | 24 |

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)