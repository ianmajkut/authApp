# AuthApp

Proyecto desarrollado en Angular conectado con el backend de NodeJS que se encuentra en el siguiente [repositorio](https://github.com/ianmajkut/authBackend). Para esta app se utilizó [lazy-loading](https://angular.io/guide/lazy-loading-ngmodules), [reactiveForms](https://angular.io/guide/reactive-forms), [routingGuards](https://codecraft.tv/courses/angular/routing/router-guards/), entre otras cosas.

## Routes 

El módulo `app-routing.module.ts` se encarga de definir las rutas principales y habilitamos el lazy-load. 

```ts
const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./protected/protected.module').then(m => m.ProtectedModule),
    canActivate: [ValidarTokenGuard],
    canLoad: [ValidarTokenGuard]
  },
  {
    path: '**',
    redirectTo: 'auth'
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    useHash: false
  })],
  exports: [RouterModule]
})
```
* auth-routing.module.ts
```ts
const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      {
        path: 'login',
        component: LoginComponent
      },
      {
        path: 'registro',
        component: RegisterComponent
      },
      {
        path: '**',
        redirectTo: 'login'
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
```
* protected-routing.module.ts
```ts
const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: DashboardComponent
      },
      {
        path: '**',
        redirectTo: ''
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
```

## Servicio

* registro()
```ts

registro( name: string, email: string, password: string ) {

    const url  = `${ this.baseUrl }/auth/new`;
    
    // Variable al cual le seteamos el emal, password, name que recibimos como parametros
    const body = { email, password, name };

    // Petición POST a 'https://auth-meanbackend.herokuapp.com/api/auth/new'
    return this.http.post<AuthResponse>( url, body )
      .pipe(
        tap( ({ ok, token }) => {
          // Si todo está bien y 'ok' = true guardamos el token generado
          if ( ok ) {
            localStorage.setItem('token', token! );
          }
        }),
        map( resp => resp.ok ),
        catchError( err => {
          // Devolvemos un Observable con el mensaje de error
          return of(err.error.msg)
        } )
      );

  }
```
* login()
```ts
login(email: string, password: string){

    const url = `${this.baseUrl}/auth `
    const body = { email, password }

    // Petición POST a 'https://auth-meanbackend.herokuapp.com/api/auth'
    return this.http.post<AuthResponse>(url, body)
      .pipe(
        tap(resp => {
        // Si el login es correcto, seteamos el token en el localStorage
          if(resp.ok) {
            localStorage.setItem('token', resp.token!)
          } 
        }),
        map( valido => valido.ok),
        catchError(err=>of(err.error.msg))
        
      )
  }
```
* validarToken()
```ts
validarToken(): Observable<boolean> {
    const url = `${this.baseUrl}/auth/renew `
    
    // Creamos una variable con el key 'x-token' y el valor es el token del localStorage
    // para pasar en la petición al header 
    const headers = new HttpHeaders()
                    .set('x-token', localStorage.getItem('token') || '')

    // Petición GET a 'https://auth-meanbackend.herokuapp.com/api/auth/renew' pasando el token por el header
    return this.http.get<AuthResponse>(url, {headers: headers })
                .pipe(
                  map(resp => {
                    // Guardamos el nuevo token en el localStorage
                    localStorage.setItem('token', resp.token!)
                    // Asignamos 
                    this._usuario = {
                      name: resp.name!,
                      uid: resp.uid!,
                      email: resp.email!
                    }
                    return resp.ok
                  }),
                  catchError(err => of(false))
                )
  }
```
* logout()
```ts
logout(){
    localStorage.clear()
}
```

## Components
### Login

En este componente tenemos un Reactive Forms con sus correspondientes validaciones junto con el método `login()` .
```ts
  emailPattern: string = "^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$"

  miFormulario: FormGroup = this.fb.group({
    email: ['test2@test.com', [Validators.required, Validators.email, Validators.pattern(this.emailPattern)]],
    password: ['123456', [Validators.required, Validators.minLength(6)]]
  })
  
  [...]
  
  login(){
    
    const {email, password} = this.miFormulario.value

    // Llamamos al método 'login()' del servicio pasándole la contraseña y el email
    this.authService.login(email, password)
        .subscribe(ok =>{
          // Si la respuesta del servicio es 'true', navegamos al dashboard
          if(ok === true){
            this.router.navigateByUrl('/dashboard')
          }else{
          // En caso de algún eror, mostramos alerta de 'SweetAlert2' con el 'ok'
          // que, en vez de 'true', tendrá el mensaje de error
           Swal.fire('Error', ok, 'error') 
          }
        })
  }
  
  
```

### Register

En este componente tenemos un Reactive Forms con sus correspondientes validaciones junto con el método `registrar()` .

```ts
emailPattern: string = "^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$"

  miFormulario: FormGroup = this.fb.group({
    name: ['Test1', [Validators.required, Validators.minLength(3)]],
    email: ['test1@test.com', [Validators.required, Validators.pattern(this.emailPattern)]],
    password: ['123456', [Validators.required, Validators.minLength(6)]],
  })

[...]

registrar(){
    const { name, email, password } = this.miFormulario.value;
    
    // Llamamos al método 'registro()' del servicio pasándole la contraseña, el email y el nombre del usuario
    this.authService.registro( name, email, password )
      .subscribe( ok => {
        if ( ok === true ) {
          // Si todo salió bien, vamos a la ruta '/auth' donde nos logueamos
          this.router.navigateByUrl('/auth');
        } else {
          // En caso de error, se dispara el 'SweetAlert2' mostrando el mensaje de error correspondiente
          Swal.fire('Error', ok, 'error');
        }
      });
  }

```

### Dashboard

En este componente tenemos un getter donde llamamos al `get usuario()` del servicio para obtener la información que luego usamos para mostrarla en pantalla. También tenemos el método `logout()` que nos dirige al path `/auth` y llama al método `logout()` del servicio.

```ts
get usuario(){
    return this.authService.usuario
}

constructor(private router: Router, private authService: AuthService) { }

logoout(){
    this.router.navigateByUrl('/auth')
    this.authService.logout()
}

```

### Guards

En este proyecto tenemos el guard `validar-token.guard.ts` donde tenemos el guard `canActivate()` y `canLoad()` que usamos en el `app-routing.module.ts`.

```ts
canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    //Llammos al método 'validarToken()' que nos devuelve un boolean 
    return this.authService.validarToken()
                .pipe(
                  tap(valid => {
                    if(!valid){
                    // Si el token es invalido nos devuelve 'false' por ende nos dirige al path 'auth'
                      this.router.navigateByUrl('/auth')
                    }
                  })
                )
  }
  canLoad(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    //Llammos al método 'validarToken()' que nos devuelve un boolean 
    return this.authService.validarToken()
                .pipe(
                  tap(valid => {
                    if(!valid){
                    // Si el token es invalido nos devuelve 'false' por ende nos dirige al path 'auth'
                      this.router.navigateByUrl('/auth')
                    }
                  })
                )
  }
```
