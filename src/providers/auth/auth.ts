// src/services/auth.service.ts
import { Injectable, NgZone } from '@angular/core';
import { Storage } from '@ionic/storage';

// Import AUTH_CONFIG, Auth0Cordova, and auth0.js
import { AUTH_CONFIG } from './auth.config';
import Auth0Cordova from '@auth0/cordova';
import * as auth0 from 'auth0-js';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { Platform } from 'ionic-angular';


@Injectable()
export class AuthProvider {
  Auth0 = new auth0.WebAuth(AUTH_CONFIG);
  Client = new Auth0Cordova(AUTH_CONFIG);
  accessToken: string;
  user: any;
  loggedIn: boolean;
  loading = true;
  tokenInstagram:string;
  datosInstagram:any;

  constructor(
    public zone: NgZone,
    private storage: Storage,
    private http:HttpClient,
    private platform:Platform
  ) {
    this.storage.get('profile').then(user => this.user = user);
    this.storage.get('access_token').then(token => this.accessToken = token);
    this.storage.get('expires_at').then(exp => {
      this.loggedIn = Date.now() < JSON.parse(exp);
      this.loading = false;
      if(this.user){
        this.mostrar();
      }
      
    });
    
    
  }

  login() {
    
    if(!this.loading){
    this.loggedIn=false;
    }
    this.loading = true;
    const options = {
      scope: 'openid profile offline_access'
    };
    // Authorize login request with Auth0: open login page and get auth results
    try {
      this.Client.authorize(options, (err, authResult) => {
        if (err) {
          this.loading=false;
          console.log("error al autenticar: ",err);
          throw err;
        }
        // Set Access Token
        this.storage.set('access_token', authResult.accessToken);
        this.accessToken = authResult.accessToken;
        console.log("token", authResult.accessToken);
        
        // Set Access Token expiration
        const expiresAt = JSON.stringify((authResult.expiresIn * 1000) + new Date().getTime());
        this.storage.set('expires_at', expiresAt);
        // Set logged in
        this.loading = false;
        this.loggedIn = true;
        // Fetch user's profile info
        this.Auth0.client.userInfo(this.accessToken, (err, profile) => {
          if (err) {
            console.log("error pasando el perfil: ",err);
            throw err;
          }
          console.log("perfil:");
          console.log(profile);
          
          
          this.storage.set('profile', profile).then(val =>
            this.zone.run(() => {
              this.user = profile;
                if(this.user){
                  this.mostrar();
                }
            })
          );
        });
      });
      
    } catch (error) {
      this.loading=false;
      console.log("error en catch");
      console.log(error);
      
    }

    const prom = new Promise( (resolve,reject)=>{
        if (this.user) {
          console.log("tiene datos");
          
        }else{
          console.log(" no tiene datos");
        }
    } );
    prom.then(data=>{
          console.log(data);
          
    })

  }

  logout() {
    this.storage.remove('profile');
    this.storage.remove('access_token');
    this.storage.remove('expires_at');
    this.accessToken = null;
    this.user = null;
    this.loggedIn = false;
    this.tokenInstagram=null;
    this.datosInstagram=null;
  }




  mostrar(){
    let url;
    let headers;
    let  dataauth;
    if (this.platform.is("cordova")) {
      //let url=`https://api.instagram.com/v1/users/self/media/recent?access_token=${this.accessToken}`;
     
     url=`https://hermancarrasco.auth0.com/api/v2/users/${this.user['sub']}`;
     headers = new HttpHeaders({
      'Authorization':'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlFVVXdOVE01T0RaR01VUTNSamRGT1RCRE16YzBSRU0zTWpZNE5qYzRRek0wUlVReVFVWkNRZyJ9.eyJpc3MiOiJodHRwczovL2hlcm1hbmNhcnJhc2NvLmF1dGgwLmNvbS8iLCJzdWIiOiJIU001RlRUc1FQeE1OeDk4cE10YWhoVTM2OHExYUthUUBjbGllbnRzIiwiYXVkIjoiaHR0cHM6Ly9oZXJtYW5jYXJyYXNjby5hdXRoMC5jb20vYXBpL3YyLyIsImlhdCI6MTUzNjM4MjU3MiwiZXhwIjoxNTM2NDY4OTcyLCJhenAiOiJIU001RlRUc1FQeE1OeDk4cE10YWhoVTM2OHExYUthUSIsInNjb3BlIjoicmVhZDpjbGllbnRfZ3JhbnRzIGNyZWF0ZTpjbGllbnRfZ3JhbnRzIGRlbGV0ZTpjbGllbnRfZ3JhbnRzIHVwZGF0ZTpjbGllbnRfZ3JhbnRzIHJlYWQ6dXNlcnMgdXBkYXRlOnVzZXJzIGRlbGV0ZTp1c2VycyBjcmVhdGU6dXNlcnMgcmVhZDp1c2Vyc19hcHBfbWV0YWRhdGEgdXBkYXRlOnVzZXJzX2FwcF9tZXRhZGF0YSBkZWxldGU6dXNlcnNfYXBwX21ldGFkYXRhIGNyZWF0ZTp1c2Vyc19hcHBfbWV0YWRhdGEgY3JlYXRlOnVzZXJfdGlja2V0cyByZWFkOmNsaWVudHMgdXBkYXRlOmNsaWVudHMgZGVsZXRlOmNsaWVudHMgY3JlYXRlOmNsaWVudHMgcmVhZDpjbGllbnRfa2V5cyB1cGRhdGU6Y2xpZW50X2tleXMgZGVsZXRlOmNsaWVudF9rZXlzIGNyZWF0ZTpjbGllbnRfa2V5cyByZWFkOmNvbm5lY3Rpb25zIHVwZGF0ZTpjb25uZWN0aW9ucyBkZWxldGU6Y29ubmVjdGlvbnMgY3JlYXRlOmNvbm5lY3Rpb25zIHJlYWQ6cmVzb3VyY2Vfc2VydmVycyB1cGRhdGU6cmVzb3VyY2Vfc2VydmVycyBkZWxldGU6cmVzb3VyY2Vfc2VydmVycyBjcmVhdGU6cmVzb3VyY2Vfc2VydmVycyByZWFkOmRldmljZV9jcmVkZW50aWFscyB1cGRhdGU6ZGV2aWNlX2NyZWRlbnRpYWxzIGRlbGV0ZTpkZXZpY2VfY3JlZGVudGlhbHMgY3JlYXRlOmRldmljZV9jcmVkZW50aWFscyByZWFkOnJ1bGVzIHVwZGF0ZTpydWxlcyBkZWxldGU6cnVsZXMgY3JlYXRlOnJ1bGVzIHJlYWQ6cnVsZXNfY29uZmlncyB1cGRhdGU6cnVsZXNfY29uZmlncyBkZWxldGU6cnVsZXNfY29uZmlncyByZWFkOmVtYWlsX3Byb3ZpZGVyIHVwZGF0ZTplbWFpbF9wcm92aWRlciBkZWxldGU6ZW1haWxfcHJvdmlkZXIgY3JlYXRlOmVtYWlsX3Byb3ZpZGVyIGJsYWNrbGlzdDp0b2tlbnMgcmVhZDpzdGF0cyByZWFkOnRlbmFudF9zZXR0aW5ncyB1cGRhdGU6dGVuYW50X3NldHRpbmdzIHJlYWQ6bG9ncyByZWFkOnNoaWVsZHMgY3JlYXRlOnNoaWVsZHMgZGVsZXRlOnNoaWVsZHMgdXBkYXRlOnRyaWdnZXJzIHJlYWQ6dHJpZ2dlcnMgcmVhZDpncmFudHMgZGVsZXRlOmdyYW50cyByZWFkOmd1YXJkaWFuX2ZhY3RvcnMgdXBkYXRlOmd1YXJkaWFuX2ZhY3RvcnMgcmVhZDpndWFyZGlhbl9lbnJvbGxtZW50cyBkZWxldGU6Z3VhcmRpYW5fZW5yb2xsbWVudHMgY3JlYXRlOmd1YXJkaWFuX2Vucm9sbG1lbnRfdGlja2V0cyByZWFkOnVzZXJfaWRwX3Rva2VucyBjcmVhdGU6cGFzc3dvcmRzX2NoZWNraW5nX2pvYiBkZWxldGU6cGFzc3dvcmRzX2NoZWNraW5nX2pvYiByZWFkOmN1c3RvbV9kb21haW5zIGRlbGV0ZTpjdXN0b21fZG9tYWlucyBjcmVhdGU6Y3VzdG9tX2RvbWFpbnMgcmVhZDplbWFpbF90ZW1wbGF0ZXMgY3JlYXRlOmVtYWlsX3RlbXBsYXRlcyB1cGRhdGU6ZW1haWxfdGVtcGxhdGVzIiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIn0.QN1j0PM6s6X2gfwBZ9o5jFTu6DqSPqYo3siGKj1AOWnYy_CO6SCKDN-AX4xL7q1s9CeRetSF4DUmXGvt9zg_nruZ-wINobXgqvn5Q4UMVCJwIwjmtF60AK34OHo4kL4dLIsUQrMKgK-rLtmsfbUWCybFDnKFL1WGF-w1jjPdxK87gglj0Ah_NXh0hJ3QeJqLWcmt0kQjv1lJ12JffttzMGHlIKE4-Zx7dQmsvAH02z039aqmuMI_zywaTuqnMoRVAzKPRLkPulWvv3x7bQ7E9vMKCJYVOlCgpbNYy_auhPweJsAKB9nXb887jY1xsJouvn4wRUGClD7-iOBDe2GsQQ'
    });
    }else{
      url=`https://hermancarrasco.auth0.com/api/v2/users/instagram|8552057049`;
    //let url=`https://hermancarrasco.auth0.com/api/v2/users/${this.user['sub']}`;
     headers = new HttpHeaders({
      'Authorization':'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlFVVXdOVE01T0RaR01VUTNSamRGT1RCRE16YzBSRU0zTWpZNE5qYzRRek0wUlVReVFVWkNRZyJ9.eyJpc3MiOiJodHRwczovL2hlcm1hbmNhcnJhc2NvLmF1dGgwLmNvbS8iLCJzdWIiOiJIU001RlRUc1FQeE1OeDk4cE10YWhoVTM2OHExYUthUUBjbGllbnRzIiwiYXVkIjoiaHR0cHM6Ly9oZXJtYW5jYXJyYXNjby5hdXRoMC5jb20vYXBpL3YyLyIsImlhdCI6MTUzNjM4MjU3MiwiZXhwIjoxNTM2NDY4OTcyLCJhenAiOiJIU001RlRUc1FQeE1OeDk4cE10YWhoVTM2OHExYUthUSIsInNjb3BlIjoicmVhZDpjbGllbnRfZ3JhbnRzIGNyZWF0ZTpjbGllbnRfZ3JhbnRzIGRlbGV0ZTpjbGllbnRfZ3JhbnRzIHVwZGF0ZTpjbGllbnRfZ3JhbnRzIHJlYWQ6dXNlcnMgdXBkYXRlOnVzZXJzIGRlbGV0ZTp1c2VycyBjcmVhdGU6dXNlcnMgcmVhZDp1c2Vyc19hcHBfbWV0YWRhdGEgdXBkYXRlOnVzZXJzX2FwcF9tZXRhZGF0YSBkZWxldGU6dXNlcnNfYXBwX21ldGFkYXRhIGNyZWF0ZTp1c2Vyc19hcHBfbWV0YWRhdGEgY3JlYXRlOnVzZXJfdGlja2V0cyByZWFkOmNsaWVudHMgdXBkYXRlOmNsaWVudHMgZGVsZXRlOmNsaWVudHMgY3JlYXRlOmNsaWVudHMgcmVhZDpjbGllbnRfa2V5cyB1cGRhdGU6Y2xpZW50X2tleXMgZGVsZXRlOmNsaWVudF9rZXlzIGNyZWF0ZTpjbGllbnRfa2V5cyByZWFkOmNvbm5lY3Rpb25zIHVwZGF0ZTpjb25uZWN0aW9ucyBkZWxldGU6Y29ubmVjdGlvbnMgY3JlYXRlOmNvbm5lY3Rpb25zIHJlYWQ6cmVzb3VyY2Vfc2VydmVycyB1cGRhdGU6cmVzb3VyY2Vfc2VydmVycyBkZWxldGU6cmVzb3VyY2Vfc2VydmVycyBjcmVhdGU6cmVzb3VyY2Vfc2VydmVycyByZWFkOmRldmljZV9jcmVkZW50aWFscyB1cGRhdGU6ZGV2aWNlX2NyZWRlbnRpYWxzIGRlbGV0ZTpkZXZpY2VfY3JlZGVudGlhbHMgY3JlYXRlOmRldmljZV9jcmVkZW50aWFscyByZWFkOnJ1bGVzIHVwZGF0ZTpydWxlcyBkZWxldGU6cnVsZXMgY3JlYXRlOnJ1bGVzIHJlYWQ6cnVsZXNfY29uZmlncyB1cGRhdGU6cnVsZXNfY29uZmlncyBkZWxldGU6cnVsZXNfY29uZmlncyByZWFkOmVtYWlsX3Byb3ZpZGVyIHVwZGF0ZTplbWFpbF9wcm92aWRlciBkZWxldGU6ZW1haWxfcHJvdmlkZXIgY3JlYXRlOmVtYWlsX3Byb3ZpZGVyIGJsYWNrbGlzdDp0b2tlbnMgcmVhZDpzdGF0cyByZWFkOnRlbmFudF9zZXR0aW5ncyB1cGRhdGU6dGVuYW50X3NldHRpbmdzIHJlYWQ6bG9ncyByZWFkOnNoaWVsZHMgY3JlYXRlOnNoaWVsZHMgZGVsZXRlOnNoaWVsZHMgdXBkYXRlOnRyaWdnZXJzIHJlYWQ6dHJpZ2dlcnMgcmVhZDpncmFudHMgZGVsZXRlOmdyYW50cyByZWFkOmd1YXJkaWFuX2ZhY3RvcnMgdXBkYXRlOmd1YXJkaWFuX2ZhY3RvcnMgcmVhZDpndWFyZGlhbl9lbnJvbGxtZW50cyBkZWxldGU6Z3VhcmRpYW5fZW5yb2xsbWVudHMgY3JlYXRlOmd1YXJkaWFuX2Vucm9sbG1lbnRfdGlja2V0cyByZWFkOnVzZXJfaWRwX3Rva2VucyBjcmVhdGU6cGFzc3dvcmRzX2NoZWNraW5nX2pvYiBkZWxldGU6cGFzc3dvcmRzX2NoZWNraW5nX2pvYiByZWFkOmN1c3RvbV9kb21haW5zIGRlbGV0ZTpjdXN0b21fZG9tYWlucyBjcmVhdGU6Y3VzdG9tX2RvbWFpbnMgcmVhZDplbWFpbF90ZW1wbGF0ZXMgY3JlYXRlOmVtYWlsX3RlbXBsYXRlcyB1cGRhdGU6ZW1haWxfdGVtcGxhdGVzIiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIn0.QN1j0PM6s6X2gfwBZ9o5jFTu6DqSPqYo3siGKj1AOWnYy_CO6SCKDN-AX4xL7q1s9CeRetSF4DUmXGvt9zg_nruZ-wINobXgqvn5Q4UMVCJwIwjmtF60AK34OHo4kL4dLIsUQrMKgK-rLtmsfbUWCybFDnKFL1WGF-w1jjPdxK87gglj0Ah_NXh0hJ3QeJqLWcmt0kQjv1lJ12JffttzMGHlIKE4-Zx7dQmsvAH02z039aqmuMI_zywaTuqnMoRVAzKPRLkPulWvv3x7bQ7E9vMKCJYVOlCgpbNYy_auhPweJsAKB9nXb887jY1xsJouvn4wRUGClD7-iOBDe2GsQQ'
    });
    }
    let urlInsta="https://api.instagram.com/v1/users/self/?access_token=";

    const promesa = new Promise((resolve,reject)=>{
      this.http.get(url,{headers})
      .subscribe((data:any)=>{
         dataauth=data;
         //this.datosInstagram=data;
         this.tokenInstagram=data.identities[0].access_token;
         console.log("tokenInstagram: ",this.tokenInstagram);
         console.log(data);
         resolve();
      });
    });
    promesa.then(() =>  {
      console.log("then");
      this.http.get(urlInsta+dataauth.identities[0].access_token)
      .subscribe(data=>{
        console.log("desde el then");
        console.log(data);
        this.datosInstagram=data;
        return data;
      });
     
     
    });
    
  }


}