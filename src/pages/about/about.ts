import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { AuthProvider } from '../../providers/auth/auth';

@Component({
  selector: 'page-about',
  templateUrl: 'about.html'
})
export class AboutPage {
  
  datos:any;

  constructor(public navCtrl: NavController,public auth:AuthProvider) {
        auth.mostrar();
  }

  


}
