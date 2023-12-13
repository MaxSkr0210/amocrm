import { Controller, Get, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Request, Response } from 'express';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  access_token: string = '';
  code: string = '';

  @Get()
  //Получаем список контактов
  async getContacts(@Req() req: Request, @Res() res: Response) {
    try {
      const email = req.query.email;
      const phone = req.query.phone;

      let uri = `https://maxskr03.amocrm.ru/api/v4/contacts`;

      let query = uri;
      let isPhone = false;

      if (phone && phone.length !== 0) {
        query += `?query=${phone}`;
        isPhone = true;
      }
      if (email && email.length !== 0) {
        if (isPhone) query += `&query=${email}`;
        else query += `?query=${email}`;
      }

      const resContacts = await axios.get(query, {
        headers: {
          Authorization: 'Bearer ' + this.access_token,
        },
      });

      //Если список контаков пуст, создаем новый контакт и сделку
      if (resContacts.data.length === 0) {
        const a = await this.appService.addContact(
          uri,
          req.query,
          this.access_token,
        );

        await this.appService.createDeal(
          'Создание контакта',
          a.data._embedded.contacts[0].id,
          this.access_token,
        );
        res.json('Создан новый контакт');
      } else {
        //иначе изменяем контакт, создаем сделку и выводим контакт
        if (req.query.name || req.query.phone || req.query.email) {
          const id = resContacts.data._embedded.contacts[0].id;

          const a = await this.appService.changeContact(
            uri,
            id,
            req.query,
            this.access_token,
            resContacts.data,
          );

          await this.appService.createDeal(
            'Изменение контакта',
            a.data.id,
            this.access_token,
          );
          res.json(resContacts.data);
        } else {
          res.json(resContacts.data);
        }
      }
    } catch (error) {
      console.log(error);

      //Если возникают ошибки, удалаяем ключ для авторизации и регитстрируемся по новой
      this.access_token = '';
      this.code = '';
      res.redirect('/amocrm');
    }
  }
  //Путь по которому мы регистрируемся
  @Get('/amocrm')
  async login(@Req() req: Request, @Res() res: Response) {
    const client_id = this.configService.get('CLIENT_ID');

    this.code = req.query.code as string;

    //если code пустой или его нет, то переходим к странице amocrm
    if (!this.code || this.code.length === 0) {
      return res.redirect(
        `https://www.amocrm.ru/oauth?client_id=${client_id}&mode=popup`,
      );
    }
    const client_secret = this.configService.get('CLIENT_SECRET');
    const redirect_uri = this.configService.get('REDIRECT_URI');

    const body = {
      client_id,
      client_secret,
      grant_type: 'authorization_code',
      code: this.code,
      redirect_uri,
    };

    try {
      const data = await axios.post(
        'https://maxskr03.amocrm.ru/oauth2/access_token',
        body,
      );

      // Если все успешно, то идем к основной странице
      this.access_token = data.data.access_token;
      res.redirect('/');
    } catch (error) {
      res.redirect(
        `https://www.amocrm.ru/oauth?client_id=${client_id}&mode=popup`,
      );
    }
  }
}
