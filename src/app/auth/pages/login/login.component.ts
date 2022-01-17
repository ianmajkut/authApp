import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styles: [
  ]
})
export class LoginComponent implements OnInit {

  emailPattern: string = "^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$"

  miFormulario: FormGroup = this.fb.group({
    email: ['test2@test.com', [Validators.required, Validators.email, Validators.pattern(this.emailPattern)]],
    password: ['123456', [Validators.required, Validators.minLength(6)]]
  })

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) { }

  ngOnInit(): void {
  }

  login(){
    console.log(this.miFormulario.value)
    const {email, password} = this.miFormulario.value

    this.authService.login(email, password)
        .subscribe(resp =>{
          console.log(resp)
        })
    // this.router.navigateByUrl('/dashboard')
  }

}
