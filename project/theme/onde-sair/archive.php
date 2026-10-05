<?php
/**
 * Archive (genérico) · usado para lugares, roteiros e search
 */
if ( ! defined( 'ABSPATH' ) ) exit;
get_header();
$post_type = get_post_type() ?: 'lugar';
$is_search = is_search();
?>

<div class="shell">

    <section class="hero">
        <span class="eyebrow"><?php echo $is_search ? 'Resultado da busca' : ucfirst( $post_type . 's' ); ?> · <?php echo esc_html( ondesair_current_city() ); ?></span>
        <div class="hero-grid">
            <h1>
                <?php if ( $is_search ) : ?>
                    Resultado pra<br><span class="it">"<?php echo esc_html( get_search_query() ); ?>"</span>
                <?php else : ?>
                    <?php echo $post_type === 'roteiro' ? 'Todos os <span class="it">roteiros</span>.' : 'Todos os <span class="it">lugares</span>.'; ?>
                <?php endif; ?>
            </h1>
            <aside class="hero-side">
                <form role="search" method="get" action="<?php echo esc_url( home_url( '/' ) ); ?>" style="display:flex;gap:8px;">
                    <input type="search" name="s" value="<?php echo esc_attr( get_search_query() ); ?>" placeholder="bar com chope no Centro..." style="flex:1;height:48px;padding:0 18px;border-radius:999px;border:1px solid var(--primary-border);background:#fff;font-family:inherit;font-size:15px;">
                    <button class="btn btn-primary" type="submit">Buscar</button>
                </form>
            </aside>
        </div>
    </section>

    <section class="section">
        <?php if ( have_posts() ) : ?>
            <div class="<?php echo $post_type === 'roteiro' ? 'roteiro-grid' : 'places-grid'; ?>">
                <?php while ( have_posts() ) : the_post();
                    $tipos_p = get_the_terms( get_the_ID(), 'tipo' );
                    $tipo_lbl = ( $tipos_p && ! is_wp_error( $tipos_p ) ) ? $tipos_p[0]->name : '';
                    $affs_p = get_the_terms( get_the_ID(), 'afinidade' );
                    $aff = ( $affs_p && ! is_wp_error( $affs_p ) ) ? $affs_p[0] : null;
                ?>
                    <?php if ( get_post_type() === 'roteiro' ) : ?>
                        <a class="card roteiro interactive" href="<?php the_permalink(); ?>">
                            <?php ondesair_thumb( 'os-roteiro', $aff ? $aff->name : '' ); ?>
                            <div class="body">
                                <?php if ( $aff ) : ?><span class="chip"><?php echo esc_html( $aff->name ); ?></span><?php endif; ?>
                                <h3><?php the_title(); ?></h3>
                                <p><?php echo wp_kses_post( get_the_excerpt() ); ?></p>
                            </div>
                        </a>
                    <?php else : ?>
                        <a class="card place interactive" href="<?php the_permalink(); ?>">
                            <?php ondesair_thumb( 'os-card', $tipo_lbl ); ?>
                            <div class="body">
                                <?php if ( $tipo_lbl ) : ?><span class="chip-type"><?php echo esc_html( $tipo_lbl ); ?></span><?php endif; ?>
                                <h4><?php the_title(); ?></h4>
                                <p class="sub"><?php echo esc_html( ondesair_meta( '_os_bairro' ) ); ?> · <?php echo wp_kses_post( get_the_excerpt() ); ?></p>
                            </div>
                            <div class="footer">
                                <span class="stars">★ <?php echo esc_html( ondesair_meta( '_os_rating', '4.7' ) ); ?></span>
                                <span><?php echo esc_html( ondesair_price_label() ); ?></span>
                            </div>
                        </a>
                    <?php endif; ?>
                <?php endwhile; ?>
            </div>
            <div class="row" style="justify-content:center;margin-top:32px;">
                <?php the_posts_pagination( [ 'mid_size' => 1, 'prev_text' => '← Anteriores', 'next_text' => 'Próximos →' ] ); ?>
            </div>
        <?php else : ?>
            <p class="mute" style="text-align:center;padding:48px 0;">Nada bateu com sua busca. Tente afrouxar um termo.</p>
        <?php endif; ?>
    </section>

</div>

<?php get_footer();
