// src/services/auth.service.ts
import { Injectable, NgZone } from '@angular/core';
import { Storage } from '@ionic/storage';

// Import AUTH_CONFIG, Auth0Cordova, and auth0.js
import { AUTH_CONFIG } from './auth.config';
import Auth0Cordova from '@auth0/cordova';
import * as auth0 from 'auth0-js';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class AuthProvider {
  Auth0 = new auth0.WebAuth(AUTH_CONFIG);
  Client = new Auth0Cordova(AUTH_CONFIG);
  accessToken: string;
  user: any;
  loggedIn: boolean;
  loading = true;

  constructor(
    public zone: NgZone,
    private storage: Storage,
    private http:HttpClient
  ) {
    this.storage.get('profile').then(user => this.user = user);
    this.storage.get('access_token').then(token => this.accessToken = token);
    this.storage.get('expires_at').then(exp => {
      this.loggedIn = Date.now() < JSON.parse(exp);
      this.loading = false;
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
            this.zone.run(() => this.user = profile)
          );
        });
      });
    } catch (error) {
      this.loading=false;
      console.log("error en catch");
      console.log(error);
      
    }
  }

  logout() {
    this.storage.remove('profile');
    this.storage.remove('access_token');
    this.storage.remove('expires_at');
    this.accessToken = null;
    this.user = null;
    this.loggedIn = false;
  }



  mostrar(){
    let url=`https://api.instagram.com/v1/users/self/media/recent?access_token=${this.accessToken}`;

    return this.http.get(url);

  }


}