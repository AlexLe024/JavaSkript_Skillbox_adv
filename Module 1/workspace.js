// JavaScript
document.addEventListener("DOMContentLoaded", function() {
  var toggleButton = document.getElementById("toggleButton");
  var dropdownBlock = document.getElementById("dropdownBlock");

  console.log(toggleButton); // Проверяем, найден ли элемент кнопки
  console.log(dropdownBlock); // Проверяем, найден ли элемент блока

  // Обработчик события для кнопки
  toggleButton.addEventListener("click", function() {
      dropdownBlock.classList.toggle("show");
  });

  // Обработчик события для закрытия блока при щелчке за его пределами
  document.addEventListener("click", function(event) {
      if (!dropdownBlock.contains(event.target) && event.target !== toggleButton) {
          dropdownBlock.classList.remove("show");
      }
  });

  // Добавляем обработчик события прокрутки
  window.addEventListener("scroll", function() {
    if (window.pageYOffset > 100) {
      // Если прокрутка больше 100 пикселей, показываем кнопку "Наверх"
      document.getElementById("scrollToTopBtn").style.display = "block";
    } else {
      // Иначе скрываем кнопку "Наверх"
      document.getElementById("scrollToTopBtn").style.display = "none";
    }
  }, { passive: true });

  // Обработчик события для кнопки "Наверх"
  document.getElementById("scrollToTopBtn").addEventListener("click", function() {
    // Плавно прокручиваем страницу наверх
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
