export namespace main {
	
	export class BalanceRequest {
	    user_id: string;
	    encrypted_balance: string;
	
	    static createFrom(source: any = {}) {
	        return new BalanceRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.user_id = source["user_id"];
	        this.encrypted_balance = source["encrypted_balance"];
	    }
	}
	export class BalanceResponse {
	    encrypted_balance: string;
	
	    static createFrom(source: any = {}) {
	        return new BalanceResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.encrypted_balance = source["encrypted_balance"];
	    }
	}
	export class RegisterRequest {
	    login: string;
	    email: string;
	    salt: string;
	    password_hash: string;
	
	    static createFrom(source: any = {}) {
	        return new RegisterRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.login = source["login"];
	        this.email = source["email"];
	        this.salt = source["salt"];
	        this.password_hash = source["password_hash"];
	    }
	}
	export class StripePaymentIntentRequest {
	    user_id: string;
	    amount: number;
	
	    static createFrom(source: any = {}) {
	        return new StripePaymentIntentRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.user_id = source["user_id"];
	        this.amount = source["amount"];
	    }
	}
	export class StripePaymentIntentResponse {
	    client_secret: string;
	    payment_id: string;
	
	    static createFrom(source: any = {}) {
	        return new StripePaymentIntentResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.client_secret = source["client_secret"];
	        this.payment_id = source["payment_id"];
	    }
	}
	export class Transaction {
	    transaction_id: string;
	    user_id: string;
	    type: string;
	    amount: number;
	    currency: string;
	    status: string;
	    description: string;
	    payment_id?: string;
	    // Go type: time
	    created_at: any;
	    // Go type: time
	    updated_at: any;
	
	    static createFrom(source: any = {}) {
	        return new Transaction(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.transaction_id = source["transaction_id"];
	        this.user_id = source["user_id"];
	        this.type = source["type"];
	        this.amount = source["amount"];
	        this.currency = source["currency"];
	        this.status = source["status"];
	        this.description = source["description"];
	        this.payment_id = source["payment_id"];
	        this.created_at = this.convertValues(source["created_at"], null);
	        this.updated_at = this.convertValues(source["updated_at"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class TransactionListResponse {
	    transactions: Transaction[];
	    total: number;
	
	    static createFrom(source: any = {}) {
	        return new TransactionListResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.transactions = this.convertValues(source["transactions"], Transaction);
	        this.total = source["total"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class User {
	    user_id: string;
	    login: string;
	    email: string;
	    salt: string;
	    password_hash: string;
	    encrypted_balance: string;
	    // Go type: time
	    created_at: any;
	    // Go type: time
	    updated_at: any;
	
	    static createFrom(source: any = {}) {
	        return new User(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.user_id = source["user_id"];
	        this.login = source["login"];
	        this.email = source["email"];
	        this.salt = source["salt"];
	        this.password_hash = source["password_hash"];
	        this.encrypted_balance = source["encrypted_balance"];
	        this.created_at = this.convertValues(source["created_at"], null);
	        this.updated_at = this.convertValues(source["updated_at"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class UserMetaResponse {
	    user_id: string;
	    salt: string;
	    password_hash: string;
	
	    static createFrom(source: any = {}) {
	        return new UserMetaResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.user_id = source["user_id"];
	        this.salt = source["salt"];
	        this.password_hash = source["password_hash"];
	    }
	}

}

