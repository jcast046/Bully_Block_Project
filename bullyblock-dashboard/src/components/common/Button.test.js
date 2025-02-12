import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button Component', () => {
    
    test('renders the button with the correct text', () => {
        render(<Button text="Click Me" />);
        
        const buttonElement = screen.getByText(/Click Me/i);
        
        expect(buttonElement).toBeInTheDocument();
    });

    test('calls the onClick function when clicked', () => {
        const handleClick = jest.fn();
        render(<Button text="Submit" onClick={handleClick} />);

        const buttonElement = screen.getByText(/Submit/i);
        fireEvent.click(buttonElement); // Simulate user clicking the button

        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('applies the correct className when provided', () => {
        render(<Button text="Styled Button" className="custom-class" />);
        
        const buttonElement = screen.getByText(/Styled Button/i);
        
        expect(buttonElement).toHaveClass('custom-class');
        expect(buttonElement).toHaveClass('custom-button');
    });

    test('is disabled when disabled prop is true', () => {
        render(<Button text="Disabled" disabled />);
        
        const buttonElement = screen.getByText(/Disabled/i);
        
        expect(buttonElement).toBeDisabled();
    });

    test('has default type as button', () => {
        render(<Button text="Default Type" />);

        const buttonElement = screen.getByText(/Default Type/i);

        expect(buttonElement).toHaveAttribute('type', 'button');
    });

    test('sets the correct button type when provided', () => {
        render(<Button text="Submit Type" type="submit" />);

        const buttonElement = screen.getByText(/Submit Type/i);
        
        expect(buttonElement).toHaveAttribute('type', 'submit');
    });
});