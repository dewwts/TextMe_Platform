import PropTypes from 'prop-types';

/**
 * Reusable Button Component
 * @param {string} variant - 'primary', 'secondary', 'danger', 'ghost'
 * @param {string} size - 'sm', 'md', 'lg'
 * @param {boolean} fullWidth - Make button full width
 * @param {boolean} disabled - Disable button
 * @param {string} type - Button type (button, submit, reset)
 * @param {function} onClick - Click handler
 * @param {node} children - Button content
 * @param {string} className - Additional CSS classes
 */
function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick,
  children,
  className = ''
}) {
  // Base styles
  const baseStyles = 'font-medium rounded-xl transition duration-200 ease-in-out inline-flex items-center justify-center';

  // Variant styles
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-600 dark:hover:bg-blue-700',
    secondary: 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-gray-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-600 dark:hover:bg-red-700',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-300 dark:hover:bg-gray-800'
  };

  // Size styles
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  // Width style
  const widthStyle = fullWidth ? 'w-full' : '';

  // Combine all styles
  const buttonClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses}
    >
      {children}
    </button>
  );
}

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'ghost']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export default Button;
