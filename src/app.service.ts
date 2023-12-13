import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}
  //метод для создания контакта
  async addContact(uri: string, query, access_token) {
    return await axios.post(
      uri,
      [
        {
          name: query.name,
          custom_fields_values: [
            {
              field_id: 513611,
              values: [
                {
                  value: query.phone,
                },
              ],
            },
            {
              field_id: 513613,
              values: [
                {
                  value: query.email,
                },
              ],
            },
          ],
        },
      ],
      {
        headers: {
          Authorization: 'Bearer ' + access_token,
        },
      },
    );
  }
  //метод для изменения контакта
  async changeContact(
    uri: string,
    id: number,
    query,
    access_token: string,
    beginsContact,
  ) {
    const phone = beginsContact._embedded.contacts[0].custom_fields_values[0];
    const email = beginsContact._embedded.contacts[0].custom_fields_values[1];

    return await axios.patch(
      uri + '/' + id,
      {
        id: id,
        name: query.name || beginsContact.name,
        custom_fields_values: [
          {
            field_id: 513611,
            values: [
              {
                value: query.phone || phone.values[0].value,
              },
            ],
          },
          {
            field_id: 513613,
            values: [
              {
                value: query.email || email.values[0].value,
              },
            ],
          },
        ],
      },
      {
        headers: {
          Authorization: 'Bearer ' + access_token,
        },
      },
    );
  }
  async createDeal(name: string, id: number, access_token) {
    return await axios.post(
      'https://maxskr03.amocrm.ru/api/v4/leads',
      [
        {
          name,
          _embedded: {
            contacts: [{ id }],
          },
        },
      ],
      {
        headers: {
          Authorization: 'Bearer ' + access_token,
        },
      },
    );
  }
}
