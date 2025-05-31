#![no_std]
use soroban_sdk::{
    contract, contracttype, token, Address, Env, symbol_short
};

// Contract veri yapıları
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LoanRequest {
    pub borrower: Address,
    pub amount: i128,
    pub is_active: bool,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserStats {
    pub total_lent: i128,
    pub total_borrowed: i128,
    pub active_loans: u32,
}

// Contract data keys
#[contracttype]
pub enum DataKey {
    // Contract owner (treasury) address
    Treasury,
    // Native token (XLM) contract address
    NativeToken,
    // User statistics: DataKey::UserStats(user_address)
    UserStats(Address),
    // Loan requests counter
    LoanCounter,
    // Loan request: DataKey::LoanRequest(loan_id)
    LoanRequest(u32),
}

// Error codes
#[contracttype]
#[derive(Copy, Clone)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    InsufficientBalance = 3,
    LoanNotFound = 4,
    LoanAlreadyPaid = 5,
    Unauthorized = 6,
}

#[contract]
pub struct MicroLendContract;


impl MicroLendContract {
    /// Contract'ı başlatır - treasury adresi ve native token ayarlanır
    pub fn initialize(env: Env, treasury: Address, native_token: Address) -> Result<(), Error> {
        // Sadece contract deploy eden initialize edebilir
        treasury.require_auth();
        
        // Sadece bir kez initialize edilebilir
        if env.storage().instance().has(&DataKey::Treasury) {
            return Err(Error::AlreadyInitialized);
        }
        
        // Treasury ve native token adreslerini kaydet
        env.storage().instance().set(&DataKey::Treasury, &treasury);
        env.storage().instance().set(&DataKey::NativeToken, &native_token);
        
        // Loan counter'ı başlat
        env.storage().instance().set(&DataKey::LoanCounter, &0u32);
        
        Ok(())
    }
    
    /// Kredi verme işlemi - kullanıcıdan 1 XLM alıp treasury'e gönderir
    pub fn lend_credit(env: Env, lender: Address) -> Result<u32, Error> {
        // Lender authorization
        lender.require_auth();
        
        // Contract initialize edilmiş mi kontrol et
        let treasury: Address = env.storage().instance()
            .get(&DataKey::Treasury)
            .ok_or(Error::NotInitialized)?;
        
        let native_token: Address = env.storage().instance()
            .get(&DataKey::NativeToken)
            .ok_or(Error::NotInitialized)?;
        
        // 1 XLM = 10^7 stroops
        let loan_amount: i128 = 10_000_000;
        
        // Token client oluştur
        let token_client = token::Client::new(&env, &native_token);
        
        // Lender'ın bakiyesini kontrol et
        let lender_balance = token_client.balance(&lender);
        if lender_balance < loan_amount {
            return Err(Error::InsufficientBalance);
        }
        
        // 1 XLM'i lender'dan treasury'e transfer et
		let lender_stats_key = lender.clone();
		let lender_transfer = lender.clone();

        token_client.transfer(&lender_transfer, &treasury, &loan_amount);
        
        // Loan request oluştur
        let loan_counter: u32 = env.storage().instance()
            .get(&DataKey::LoanCounter)
            .unwrap_or(0);
        
        let new_loan_id = loan_counter + 1;
        
        let loan_request = LoanRequest {
            borrower: lender.clone(), // Lender aynı zamanda borrower oluyor
            amount: loan_amount,
            is_active: true,
            timestamp: env.ledger().timestamp(),
        };
        
        // Loan'ı kaydet
        env.storage().instance().set(&DataKey::LoanRequest(new_loan_id), &loan_request);
        env.storage().instance().set(&DataKey::LoanCounter, &new_loan_id);
        
        // User stats güncelle
        let lender_clone = lender.clone();
        let mut user_stats = env.storage().persistent()
            .get(&DataKey::UserStats(lender_clone))
            .unwrap_or(UserStats {
                total_lent: 0,
                total_borrowed: 0,
                active_loans: 0,
            });
        
        user_stats.total_lent += loan_amount;
        user_stats.active_loans += 1;
        
        env.storage().persistent().set(&DataKey::UserStats(lender_stats_key), &user_stats);
        
        // Event emit et
        env.events().publish((symbol_short!("lend"), lender), loan_amount);
        
        Ok(new_loan_id)
    }
    
    /// Kredi alma işlemi - treasury'den kullanıcıya 1 XLM gönderir
    pub fn borrow_credit(env: Env, borrower: Address) -> Result<u32, Error> {
        // Borrower authorization
        borrower.require_auth();
        
        // Contract initialize edilmiş mi kontrol et
        let treasury: Address = env.storage().instance()
            .get(&DataKey::Treasury)
            .ok_or(Error::NotInitialized)?;
        
        let native_token: Address = env.storage().instance()
            .get(&DataKey::NativeToken)
            .ok_or(Error::NotInitialized)?;
        
        // 1 XLM = 10^7 stroops
        let loan_amount: i128 = 10_000_000;
        
        // Token client oluştur
        let token_client = token::Client::new(&env, &native_token);
        
        // Treasury'nin bakiyesini kontrol et
        let treasury_balance = token_client.balance(&treasury);
        if treasury_balance < loan_amount {
            return Err(Error::InsufficientBalance);
        }
        
        // 1 XLM'i treasury'den borrower'a transfer et
		let borrower_stats_key = borrower.clone();
		let borrower_transfer = borrower.clone();
        token_client.transfer(&treasury, &borrower_transfer, &loan_amount);
        
        // Loan request oluştur
        let loan_counter: u32 = env.storage().instance()
            .get(&DataKey::LoanCounter)
            .unwrap_or(0);
        
        let new_loan_id = loan_counter + 1;
        
        let loan_request = LoanRequest {
            borrower: borrower.clone(),
            amount: loan_amount,
            is_active: true,
            timestamp: env.ledger().timestamp(),
        };
        
        // Loan'ı kaydet
        env.storage().instance().set(&DataKey::LoanRequest(new_loan_id), &loan_request);
        env.storage().instance().set(&DataKey::LoanCounter, &new_loan_id);
        
        // User stats güncelle
        let borrower_clone = borrower.clone();
        let mut user_stats = env.storage().persistent()
            .get(&DataKey::UserStats(borrower_clone))
            .unwrap_or(UserStats {
                total_lent: 0,
                total_borrowed: 0,
                active_loans: 0,
            });
        
        user_stats.total_borrowed += loan_amount;
        user_stats.active_loans += 1;
        
        env.storage().persistent().set(&DataKey::UserStats(borrower_stats_key), &user_stats);
        
        // Event emit et
        env.events().publish((symbol_short!("borrow"), borrower,), loan_amount);
        
        Ok(new_loan_id)
    }
    
    /// Kredi geri ödeme işlemi
    pub fn repay_loan(env: Env, borrower: Address, loan_id: u32) -> Result<(), Error> {
        // Borrower authorization
        borrower.require_auth();
        
        // Contract initialize edilmiş mi kontrol et
        let treasury: Address = env.storage().instance()
            .get(&DataKey::Treasury)
            .ok_or(Error::NotInitialized)?;
        
        let native_token: Address = env.storage().instance()
            .get(&DataKey::NativeToken)
            .ok_or(Error::NotInitialized)?;
        
        // Loan request'i getir
        let mut loan_request: LoanRequest = env.storage().instance()
            .get(&DataKey::LoanRequest(loan_id))
            .ok_or(Error::LoanNotFound)?;
        
        // Loan aktif mi kontrol et
        if !loan_request.is_active {
            return Err(Error::LoanAlreadyPaid);
        }
        
        // Sadece loan'ın sahibi geri ödeyebilir
        if loan_request.borrower != borrower {
            return Err(Error::Unauthorized);
        }
        
        // Token client oluştur
        let token_client = token::Client::new(&env, &native_token);
        
        // Borrower'ın bakiyesini kontrol et
        let borrower_balance = token_client.balance(&borrower);
        if borrower_balance < loan_request.amount {
            return Err(Error::InsufficientBalance);
        }
        
        // Loan amount'ı borrower'dan treasury'e transfer et
        token_client.transfer(&borrower, &treasury, &loan_request.amount);
        
        // Loan'ı inactive yap
        loan_request.is_active = false;
        env.storage().instance().set(&DataKey::LoanRequest(loan_id), &loan_request);
        
        // User stats güncelle
        let borrower_clone = borrower.clone();
        let mut user_stats = env.storage().persistent()
            .get(&DataKey::UserStats(borrower_clone))
            .unwrap_or(UserStats {
                total_lent: 0,
                total_borrowed: 0,
                active_loans: 0,
            });
        
        if user_stats.active_loans > 0 {
            user_stats.active_loans -= 1;
        }
        
        let borrower_key = borrower.clone(); // Bu satırı ekle
		env.storage().persistent().set(&DataKey::UserStats(borrower_key), &user_stats);

        
        // Event emit et
        env.events().publish((symbol_short!("repay"), borrower), loan_request.amount);
        
        Ok(())
    }
    
    /// Kullanıcı istatistiklerini getir
    pub fn get_user_stats(env: Env, user: Address) -> UserStats {
        env.storage().persistent()
            .get(&DataKey::UserStats(user))
            .unwrap_or(UserStats {
                total_lent: 0,
                total_borrowed: 0,
                active_loans: 0,
            })
    }
    
    /// Loan detaylarını getir
    pub fn get_loan(env: Env, loan_id: u32) -> Option<LoanRequest> {
        env.storage().instance().get(&DataKey::LoanRequest(loan_id))
    }
    
    /// Treasury adresini getir
    pub fn get_treasury(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::Treasury)
    }
    
    /// Toplam loan sayısını getir
    pub fn get_loan_count(env: Env) -> u32 {
        env.storage().instance()
            .get(&DataKey::LoanCounter)
            .unwrap_or(0)
    }
    
    /// Treasury balance'ını getir
    pub fn get_treasury_balance(env: Env) -> Result<i128, Error> {
        let treasury: Address = env.storage().instance()
            .get(&DataKey::Treasury)
            .ok_or(Error::NotInitialized)?;
        
        let native_token: Address = env.storage().instance()
            .get(&DataKey::NativeToken)
            .ok_or(Error::NotInitialized)?;
        
        let token_client = token::Client::new(&env, &native_token);
        Ok(token_client.balance(&treasury))
    }
}
