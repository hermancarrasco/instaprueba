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

  }

  obtener(){
      this.auth.mostrar().subscribe(data=>{
        console.log("mostrando lo traido");
        console.log(data);
        this.datos=data;
      },err=>{
        console.log("error al mostrar la cosa");
        console.log(err);
        
      });
  }


}
