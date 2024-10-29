/* eslint-disable prettier/prettier */

import { Injectable } from '@nestjs/common';
import { PlaywrightCrawler, ProxyConfiguration } from 'crawlee';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { createObjectCsvWriter } from 'csv-writer';

@Injectable()
export class MyService {
 

  async fetchProxies() {
    const githubUrl = 'https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/http.txt';
    try {
      const response = await axios.get(githubUrl);
      const ipArray = response.data.split('\n').filter((proxy: string) => proxy.trim() !== '');
      return ipArray.map((ip: any) => `http://${ip}`);
    } catch (error) {
      console.error(`Failed to fetch proxy list: ${error.message}`);
      return [];
    }
  }

  async fetch( ): Promise<object> {
  
    const proxyUrls = await this.fetchProxies();
    const proxyConfiguration = new ProxyConfiguration({ proxyUrls });
    console.log('Proxies: ', proxyUrls);

    const crawler = new PlaywrightCrawler({
      useSessionPool: true,
      sessionPoolOptions: { maxPoolSize: 100 },
      // proxyConfiguration,
      persistCookiesPerSession: true,
      maxRequestRetries: 50,
      maxConcurrency: 10,
      minConcurrency: 1,
      navigationTimeoutSecs: 120,
      requestHandler: async ({ page, request, proxyInfo }) => {
        console.log('Scraping:', request.url);
        console.log('Using proxy:', proxyInfo?.url || 'No proxy');

        try {
          const hrefs = await page.$$eval('a', anchors => {
            return anchors
              .filter(anchor => {
                const button = anchor.querySelector('button');
                return button && button.innerText.trim() === 'View';
              })
              .map(anchor => anchor.href);
          });

          for (const link of hrefs) {
            await this.extractDataFromLink(page, link);
          }

    
          // console.log('Extracted text:', textContent);
          // console.log('formatted data: ',await this.extractValues(textContent))
 

        } catch (error) {
          console.error(`Failed to navigate to ${request.url}. Error: ${error.message}`);
        }
      },
      failedRequestHandler: async ({ request, error }) => {
        console.error(`Request ${request.url} failed too many times. Error: ${error}`);
      },
    });

    const urls = [];
  
   

    console.log('Total links:', urls.length);
    await crawler.run(['https://www.trademarkia.com/avectas-98141953']);
    return{'message': 'success'}
  }
 
 
  async saveUrlToCSV(csvData: string, fileName: string): Promise<void> {
    const filePath = path.resolve(__dirname, `${fileName}.csv`);
    fs.appendFile(filePath, csvData + '\n', (err) => {
      if (err) {
        console.error('Error writing to file', err);
      } else {
        console.log(`CSV file has been updated successfully as "${fileName}.csv"`);
      }
    });
  }

  async extractValues(data:any) {
    const pattern = /Last Applicant\/ Owned by(.*?)Serial Number(.*?)Registration Number(.*?)Correspondent Address(.*?)Filing Basis(.*?)Disclaimer(.*)/s;
  
    const match = data.match(pattern);
  
    if (match) {
      return {
        lastApplicant: match[1].trim(),
        serialNumber: match[2].trim(),
        registrationNumber: match[3].trim(),
        correspondentAddress: match[4].trim(),
        filingBasis: match[5].trim(),
        disclaimer: match[6].trim(),
      };
    } else {
      throw new Error('Data format is incorrect or labels not found');
    }
  }

  async extractDataFromLink(page:any, url: string) {
    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      const textContent = await page.$eval(
        'div.flex.flex-col.space-y-8.mt-8.ml-8',
        (div) => div.textContent.trim() // Get the text content of the div and trim whitespace
      );
      
      const extractedValues = this.extractValues(textContent);

      console.log('Extracted values from', url, extractedValues);
    } catch (error) {
      console.error(`Failed to navigate to ${url}. Error: ${error.message}`);
    }
  }
}


 
 
 