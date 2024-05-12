const cardNumberInput = document.getElementById('card-number');
const expiryDateInput = document.getElementById('expiry-date');
const cvvInput = document.getElementById('cvv');
const emailInput = document.getElementById('email');
const payButton = document.getElementById('pay-button');
const errorMessage = document.getElementById('error-message');

cardNumberInput.addEventListener('input', formatAndValidateCardNumber);
expiryDateInput.addEventListener('input', validateExpiryDate);
cvvInput.addEventListener('input', validateCvv);
emailInput.addEventListener('input', validateEmail);

expiryDateInput.addEventListener('input', function(event) {
    const input = event.target;
    const value = input.value.replace(/\D/g, ''); // Удалить все нецифровые символы
    const month = value.slice(0, 2);
    const year = value.slice(2, 4);

    if (value.length > 2) {
        input.value = `${month}/${year}`;
    }
});

payButton.addEventListener('click', function() {
    const cardNumber = cardNumberInput.value.replace(/\D/g, ''); // Удалить все нецифровые символы
    const expiryDate = expiryDateInput.value;
    const cvc = cvcInput.value;
    const email = emailInput.value;

    const isCardNumberValid = /^(\d{4}\s?){4}$/.test(cardNumber); // Проверка на правильность номера карты
    const isExpiryDateValid = /^\d{2}\/\d{2}$/.test(expiryDate); // Проверка на правильность даты окончания
    const isCvcValid = /^\d{3}$/.test(cvc); // Проверка на правильность CVC/CVV
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); // Проверка на правильность email

    if (!isCardNumberValid || !isExpiryDateValid || !isCvcValid || !isEmailValid) {
        errorMessage.style.display = 'block';
    } else {
        errorMessage.style.display = 'none';
        // Здесь можно добавить код для обработки оплаты
    }
});

function formatAndValidateCardNumber(event) {
    let cardNumber = event.target.value.replace(/\D/g, ''); // Remove all non-digit characters
    cardNumber = cardNumber.replace(/(\d{4})(?=\d)/g, '$1 '); // Add a space every 4 digits
    cardNumberInput.value = cardNumber.trim().slice(0, 19); // Trim to 19 characters and remove extra spaces

    if (/[^0-9 ]/.test(cardNumber)) {
        event.target.setCustomValidity('Номер карты может содержать только цифры');
    } else {
        event.target.setCustomValidity('');
    }

    togglePayButton();
}

function validateExpiryDate(event) {
    const expiryDate = event.target.value;
    const [month, year] = expiryDate.split('/');
    const currentYear = new Date().getFullYear() % 100; // Get last 2 digits of the current year
    const currentMonth = new Date().getMonth() + 1; // Get current month (January is 1)
    
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
        event.target.setCustomValidity('Дата окончания должна быть в формате ММ/ГГ');
    } else if (+month < 1 || +month > 12 || +year < currentYear || (+year === currentYear && +month < currentMonth)) {
        event.target.setCustomValidity('Некорректная дата окончания');
    } else {
        event.target.setCustomValidity('');
    }

    togglePayButton();
}

function validateCvv(event) {
    const cvv = event.target.value;
    if (!/^\d{3}$/.test(cvv)) {
        event.target.setCustomValidity('CVC/CVV должен содержать ровно 3 цифры');
    } else {
        event.target.setCustomValidity('');
    }

    togglePayButton();
}

function validateEmail(event) {
    const email = event.target.value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        event.target.setCustomValidity('Введите корректный email');
    } else {
        event.target.setCustomValidity('');
    }

    togglePayButton();
}

function togglePayButton() {
    const form = document.getElementById('payment-form');
    if (form.checkValidity()) {
        payButton.removeAttribute('disabled');
    } else {
        payButton.setAttribute('disabled', true);
    }
}
